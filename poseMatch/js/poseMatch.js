var gPoseMatch = null;

class PoseData {
    constructor(cmd, imgPath) {
        this.cmd = cmd;
        this.img = new Image();
        if (imgPath != null)
            this.img.src = imgPath;
    }
}

class PoseMatch {
    constructor() {
        this.data = new Map();
        this.data.set(0, new PoseData('countdown3', '/poseMatch/images/3.png'));
        this.data.set(1, new PoseData('countdown2', '/poseMatch/images/2.png'));
        this.data.set(2, new PoseData('countdown1', '/poseMatch/images/1.png'));
        this.data.set(3, new PoseData('pose1', '/poseMatch/images/tree.jpg'));
        this.data.set(6, new PoseData('pose2', '/poseMatch/images/lunge.jpg'));
        this.data.set(9, new PoseData('pose3', '/poseMatch/images/handstand.jpg'));
        this.data.set(12, new PoseData('stop', null));

        this.server = new PoseMatchServer();
        let gameCanvas = document.querySelector('#game');
        this.viewManager = new PoseMatchViewManager(gameCanvas);
        this.poseTimer = new PoseTimer(this.viewManager.getGameView(), this.data);      
        this.state = 'notReady';
    }

    init(user, userCollection) {
        let myCanvas = document.querySelector('#PoseEstimation');
        this.viewManager.addUserView(user, myCanvas);

        this.server.init(user, userCollection);
        let readyButton = document.querySelector('#readyButton');
        readyButton.addEventListener('click', function () {
            readyButton.disabled = true;
            console.log('ready button');
            PoseMatch.getInstance().getServer().setState('ready');
        });

        this.listener = function(msg) {
            let cmd = msg[0];
            let data = msg[1];
            console.log('command:', cmd);

            let state = PoseMatch.getInstance().state;
            if (cmd == 'ready') {
                PoseMatch.getInstance().getViewManager().readyUser(data);
            } else if (cmd == 'readyAll') {
                state = 'readyAll';
                PoseMatch.getInstance().getTimer().start();
                PoseMatch.getInstance().getViewManager().setState(state);
            } else if (cmd == 'pose1') {
                state = 'playing';
                PoseMatch.getInstance().getViewManager().setState(state);
            } else if (cmd == 'updateScore') {
                PoseMatch.getInstance().getViewManager().setScoreData(
                    PoseMatch.getInstance().getServer().user,
                    PoseMatch.getInstance().getServer().dataMap);
            }
            
        };

        this.server.addListener(this.listener);
        this.poseTimer.addListener(this.listener);
    }

    static getInstance() {
        if (gPoseMatch == null) {
            gPoseMatch = new PoseMatch();
        }
        return gPoseMatch;
    }

    getServer() {
        return this.server;
    }

    getTimer() {
        return this.poseTimer;
    }

    getViewManager() {
        return this.viewManager;
    }
       
}