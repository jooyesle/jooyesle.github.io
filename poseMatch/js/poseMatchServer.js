const GAME_STAGE_COUNT = 3;

class UserData {
    constructor() {
        this.state = 'notReady';
        this.score = [];
        var i;
        for (i=0; i < GAME_STAGE_COUNT; i++) {
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
                console.log('[POSE] changed data: ', data);
                if (data.state != undefined) {
                    this.dataMap.get(data.name)['state'] = data.state;
                    this.checkReadyAllUsers();
                }
                if (data.score != undefined) {
                    let userData = this.dataMap.get(data.name);
                    userData.score = data.score.split(',');
                    this.notifyToListener('updateScore');
                }
            });
        });
    }

    addUser(userId) {
        this.dataMap.set(userId, new UserData());
        //console.log('[POSE] add user', this.dataMap);    
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
        console.log('---', data);
        data.score[gameNumber] = score;
        console.log('---', data.score);
        
        this.userRef = this.userCollection.doc(this.user);
        this.userRef.set(
            {
                name: this.user,
                score: data.score.toString(),
            },
            { merge: true }
        );
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    notifyToListener(cmd, data) {
        var msg = [cmd, data];
        //console.log('notification:', msg);
        this.listeners.forEach((listener) => {
            listener(msg);
        });
    }

    checkReadyAllUsers() {
        //console.log('[POSE] checkReadyAllUsers', this.dataMap);
        var readyAll = true;
        this.dataMap.forEach((value, key, map) => {
            console.log('[POSE] check user ready', key, value.state);
            if (value.state != 'ready') {
                readyAll = false;
            } else {
                this.notifyToListener('ready', key);
            }
        });

        if (readyAll == true) {
            this.notifyToListener('readyAll', null);
        }
    }
}
