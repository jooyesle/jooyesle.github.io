var gServer = null;

class PoseTimer {
    constructor() {
        this.data = new Map();
        this.data.set(0, 'countdown3');
        this.data.set(1, 'countdown2');
        this.data.set(2, 'countdown1');
        this.data.set(5, 'pose1');
        this.data.set(8, 'pose2');
        this.data.set(11, 'pose3');
        
        this.index = 0;
        setInterval(function(poseTimer) {
            if (poseTimer.data.has(poseTimer.index)) {
                console.log(poseTimer.index, poseTimer.data);
                console.log(poseTimer.data.get(poseTimer.index));
            }
            poseTimer.index += 1;
        }, 1000, this);
    }
}

class UserData {
    constructor() {
        this.state = 'notReady';
        this.score = 0;
    }
}
class PoseMatchServer {
    constructor() {
        this.listeners = [];
        this.userCollection = null;
        this.dataMap = new Map();
        this.timer = new PoseTimer();
    }

    
    static getServer() {
        if (gServer == null)
            gServer = new PoseMatchServer();
        return gServer;
    }

    async init(user, userCollection) {
        this.user = user;
        this.addUser(this.user);
        this.userCollection = userCollection;
        this.userCollection.onSnapshot(async (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                let data = change.doc.data();
                if (data === undefined) return;
                if (change.type === "added" && data.name != this.user) {
                    this.addUser(data.name);
                }
                console.log('[POSE] changed data: ', data);
                if (data.state != undefined) {
                    this.dataMap.get(data.name)['state'] = data.state;
                    this.checkReadyAllUsers();
                }
                if (data.score != undefined) {
                    this.dataMap.get(data.name)['score'] = data.score;
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
        this.userRef.set({
            name: this.user,
            state: state
        }, {merge: true});       
    }

    async setScore(score) {
        this.userRef = this.userCollection.doc(this.user);
        this.userRef.set({
            name: this.user,
            score: score
        }, {merge: true});       
    }


    addListener(listener) {
        this.listeners.push(listener);
    }

    checkReadyAllUsers() {        
        //console.log('[POSE] checkReadyAllUsers', this.dataMap);
        var readyAll = true;
        this.dataMap.forEach((value, key, map) => {
            console.log('[POSE] check user ready', key, value.state);
            if (value.state != 'ready') {
                readyAll = false;
            }
        });

        if (readyAll == true) {
            this.listeners.forEach(listener => {
                listener('[POSE] ready all !!');
            });
        }

    }
}

function onReady() {
    PoseMatchServer.getServer().setState('ready');
    //PoseMatchServer.getServer().setScore(100);
}

const readyButton = document.querySelector('#readyButton');
readyButton.addEventListener('click', onReady);

PoseMatchServer.getServer().addListener(function(data) {
    console.log(data);
});


