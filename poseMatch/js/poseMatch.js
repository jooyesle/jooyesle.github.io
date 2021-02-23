var gPoseMatch = null;

class PoseData {
    constructor(cmd, imgPath) {
        this.cmd = cmd;
        this.img = new Image(320, 240);
        if (imgPath != null) this.img.src = imgPath;
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
        this.data.set(
            9,
            new PoseData('pose3', '/poseMatch/images/handstand.jpg')
        );
        this.data.set(12, new PoseData('stop', null));

        this.server = new PoseMatchServer();
        let gameCanvas = document.querySelector('#game');
        this.viewManager = new PoseMatchViewManager(gameCanvas);
        this.poseTimer = new PoseTimer(
            this.viewManager.getGameView(),
            this.data
        );
        this.state = 'notReady';

        this.peManager = new PoseEstimationManager(this.data);
    }

    init(user, userCollection) {
        this.user = user;
        let myCanvas = document.querySelector('#PoseEstimation');
        this.viewManager.setMyName(user);
        this.viewManager.addUserView(user, myCanvas);

        this.server.init(user, userCollection);
        let readyButton = document.querySelector('#readyButton');
        readyButton.addEventListener('click', function () {
            readyButton.disabled = true;
            console.log('ready button');
            PoseMatch.getInstance().getServer().setState('ready');
        });

        this.listener = function (msg) {
            let cmd = msg[0];
            let data = msg[1];
            console.log('command:', cmd);

            let state = PoseMatch.getInstance().state;
            if (cmd == 'ready') {
                PoseMatch.getInstance()
                    .getViewManager()
                    .setState('ready', data);
            } else if (cmd == 'readyAll') {
                state = 'readyAll';
                PoseMatch.getInstance().getTimer().start();
                PoseMatch.getInstance().getViewManager().setState(state, null);
            } else if (cmd == 'posenetLoaded') {
                console.log('posenetLoaded');
                PoseMatch.getInstance()
                    .getPEManager()
                    .createVideoPose(
                        'localvideo',
                        PoseMatch.getInstance().user,
                        true
                    );
                PoseMatch.getInstance()
                    .getPEManager()
                    .setPEListener(
                        'localvideo',
                        PoseMatch.getInstance().listener
                    );
            } else if (cmd.indexOf('pose') >= 0) {
                state = 'playing';
                PoseMatch.getInstance().getViewManager().setState(state, cmd);
                if (cmd == 'pose1') PoseMatch.getInstance().poseNumber = 0;
                else if (cmd == 'pose2') PoseMatch.getInstance().poseNumber = 1;
                else if (cmd == 'pose3') PoseMatch.getInstance().poseNumber = 2;
            } else if (cmd == 'updateRemoteScore') {
                PoseMatch.getInstance()
                    .getViewManager()
                    .setScoreData(
                        PoseMatch.getInstance().getServer().user,
                        PoseMatch.getInstance().getServer().dataMap
                    );
            } else if (cmd == 'updateScore') {
                PoseMatch.getInstance()
                    .getServer()
                    .setScore(PoseMatch.getInstance().poseNumber, data);
            } else if (cmd == 'loadComplete') {
                console.log('loadComplete');
                PoseMatch.getInstance().enableReadyButton();
            }
        };

        this.server.addListener(this.listener);
        this.poseTimer.addListener(this.listener);
        this.peManager.addListener(this.listener);
        this.peManager.init();
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

    getPEManager() {
        return this.peManager;
    }

    enableReadyButton() {
        document.getElementById('readyButton').disabled = false;
    }
}
