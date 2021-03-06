const GAME_STAGE_COUNT = 3;

class UserData {
    constructor() {
        this.state = 'notReady';
        this.score = [];
        this.imgUrl = [];
        var i;
        for (i = 0; i < GAME_STAGE_COUNT; i++) {
            this.score[i] = 0;
            this.imgUrl[i] = '';
        }
    }

    toString() {
        return this.score.toString();
    }

    fromString(str) {
        this.score.fromString(str);
    }
}

class PoseMatchServer {
    constructor() {
        this.listeners = [];
        this.userCollection = null;
        this.dataMap = new Map();
        this.readyAll = false;
        this.displayed = false;
    }

    async init(user, userCollection) {
        this.user = user;
        this.addUser(this.user);
        this.userCollection = userCollection;
        this.userCollection.onSnapshot(async (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                let data = change.doc.data();
                if (data === undefined) return;
                if (change.type === 'added' && data.name != this.user) {
                    this.addUser(data.name);
                }
                if (change.type === 'modified') {
                    console.log('Changed Data: ', data);
                    if (data.state != undefined) {
                        this.dataMap.get(data.name)['state'] = data.state;
                        if (!this.readyAll) {
                            if (data.state == 'reset') {
                                if (data.name == this.user) {
                                    this.notifyToListener('reset', data.name);
                                }
                            } else if (data.state == 'ready') {
                                this.notifyToListener('ready', data.name);
                            }
                            this.checkReadyAllUsers();
                        }
                    }
                    if (data.score != undefined) {
                        let userData = this.dataMap.get(data.name);
                        userData.score = data.score.split(',');
                        // console.log(
                        //     'update remote score:',
                        //     userData.score,
                        //     data.score
                        // );
                        this.notifyToListener('updateRemoteScore', null);
                    }
                    if (data.imgUrl != undefined) {
                        this.dataMap.get(data.name)['imgUrl'] = data.imgUrl;
                        let isDone = true;
                        this.dataMap.forEach((value, key, map) => {
                            if (value.imgUrl[2] == '') isDone = false; // [2]: last posture
                        });
                        if (isDone) this.displayResultAllUsers();
                    }
                }
            });
        });
    }

    addUser(userId) {
        this.dataMap.set(userId, new UserData());
        //console.log('Add User:', this.dataMap);
    }

    async setState(state) {
        this.userRef = this.userCollection.doc(this.user);
        this.userRef.set(
            {
                name: this.user,
                state: state,
            },
            { merge: true }
        );
    }

    async setScore(gameNumber, score) {
        let data = this.dataMap.get(this.user);
        data.score[gameNumber] = score;

        this.userRef = this.userCollection.doc(this.user);
        this.userRef.set(
            {
                name: this.user,
                score: data.score.toString(),
            },
            { merge: true }
        );
    }

    async resetScore() {
        this.userRef = this.userCollection.doc(this.user);
        this.userRef.set(
            {
                name: this.user,
                score: '0,0,0',
                imgUrl: null,
            },
            { merge: true }
        );
    }

    async setImgUrl(gameNumber, imgUrl) {
        let data = this.dataMap.get(this.user);
        data.imgUrl[gameNumber] = imgUrl;

        this.userRef = this.userCollection.doc(this.user);
        this.userRef.set(
            {
                name: this.user,
                imgUrl: data.imgUrl,
            },
            { merge: true }
        );
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    notifyToListener(cmd, data) {
        this.listeners.forEach((listener) => {
            listener(cmd, data);
        });
    }

    resetGame() {
        this.readyAll = false;
        this.setState('reset');
    }

    checkReadyAllUsers() {
        if (this.readyAll) {
            return;
        }
        console.log('CheckReadyAllUsers:', this.dataMap);

        var readyAll = true;
        this.dataMap.forEach((value, key, map) => {
            console.log('Check Ready:', key, value.state);
            if (value.state != 'ready') {
                readyAll = false;
            }
        });

        if (readyAll == true) {
            this.readyAll = true;
            this.displayed = false;
            this.resetScore();
            this.notifyToListener('readyAll', null);
        }
    }

    displayResultAllUsers() {
        if (this.displayed) return;
        this.displayed = true;
        let displayResults = document.getElementById('displayResults');
        let idx = 0;

        this.dataMap.forEach((value, key, map) => {
            let subdiv = document.createElement('div');
            displayResults.appendChild(subdiv);

            let userName = document.createElement('h2');
            userName.innerText = key;
            userName.setAttribute('class', 'result-name');
            subdiv.appendChild(userName);

            for (let i in value.imgUrl) {
                let canvas = document.createElement('canvas');
                canvas.setAttribute('width', '320');
                canvas.setAttribute('height', '240');
                canvas.setAttribute('id', 'resCan' + idx);
                canvas.setAttribute('class', 'resultCanvas');
                subdiv.appendChild(canvas);

                let img = document.createElement('img');
                img.setAttribute('width', '320');
                img.setAttribute('height', '240');
                img.setAttribute('id', 'resImg' + idx);
                img.setAttribute('class', 'resultImg');
                img.setAttribute('src', value.imgUrl[i]);

                subdiv.appendChild(img);

                idx++;
            }
        });
        this.notifyToListener('createResultPose', displayResults);
    }
}
