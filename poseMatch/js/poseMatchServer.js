const GAME_STAGE_COUNT = 3;

class UserData {
    constructor() {
        this.state = 'notReady';
        this.score = [];
        var i;
        for (i = 0; i < GAME_STAGE_COUNT; i++) {
            this.score[i] = 0;
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
                console.log('Changed Data: ', data);
                if (data.state != undefined) {
                    this.dataMap.get(data.name)['state'] = data.state;
                    this.checkReadyAllUsers();
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
        console.log('CheckReadyAllUsers:', this.dataMap);
        if (this.readyAll) {
            return;
        }
        var readyAll = true;
        this.dataMap.forEach((value, key, map) => {
            console.log('Check Ready:', key, value.state);
            if (value.state != 'ready') {
                readyAll = false;
            }
            if (value.state == 'reset') {
                this.notifyToListener('reset', key);
            } else if (value.state == 'ready') {
                this.notifyToListener('ready', key);
            }
        });

        if (readyAll == true) {
            this.readyAll = true;
            this.resetScore();
            this.notifyToListener('readyAll', null);
        }
    }
}
