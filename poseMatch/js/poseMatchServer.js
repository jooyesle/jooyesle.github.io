var gServer = null;
const gameCanvas = document.querySelector('#game');

class PoseTimer {
    constructor() {
        this.data = new Map();
        this.addImage(0, '/poseMatch/images/3.png');
        this.addImage(1, '/poseMatch/images/2.png');
        this.addImage(2, '/poseMatch/images/1.png');
        this.addImage(3, '/poseMatch/images/tree.jpg');
        this.addImage(6, '/poseMatch/images/lunge.jpg');
        this.addImage(9, '/poseMatch/images/handstand.jpg');
        this.data.set(12, 'stop');
        this.index = 0;
    }

    addImage(index, path) {
        const img = new Image();
        img.src = path;
        this.data.set(index, img);
    }

    start() {
        console.log('[POSE] start timer');
        this.timerId = setInterval(function(poseTimer) {
            if (poseTimer.data.has(poseTimer.index)) {
                if (poseTimer.data.get(poseTimer.index) == 'stop') {
                    poseTimer.stop();
                    return;
                }
                //console.log(poseTimer.data.get(poseTimer.index));
                poseTimer.drawPose(poseTimer.data.get(poseTimer.index));
            }
            poseTimer.index += 1;
        }, 1000, this);
    }

    stop() {
        console.log('[POSE] stop timer');
        clearInterval(this.timerId);
        this.clearPose();
    }

    async drawPose(img) {
        let ctx = gameCanvas.getContext("2d");
        var hRatio = gameCanvas.width  / img.width    ;
        var vRatio =  gameCanvas.height / img.height  ;
        var ratio  = Math.min ( hRatio, vRatio );
        var centerShift_x = ( gameCanvas.width - img.width*ratio ) / 2;
        var centerShift_y = ( gameCanvas.height - img.height*ratio ) / 2;

        ctx.clearRect(0,0,gameCanvas.width, gameCanvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width*ratio, img.height*ratio);
    }

    async clearPose() {
        let ctx = gameCanvas.getContext("2d");
        ctx.clearRect(0,0,gameCanvas.width, gameCanvas.height);
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
    console.log('ready button');
    PoseMatchServer.getServer().setState('ready');
    //PoseMatchServer.getServer().setScore(100);
}

const readyButton = document.querySelector('#readyButton');
readyButton.addEventListener('click', onReady);

PoseMatchServer.getServer().addListener(function(data) {
    console.log(data);
    PoseMatchServer.getServer().timer.start();
});


