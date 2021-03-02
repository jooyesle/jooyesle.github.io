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
        this.state = 'notReady';
        this.currentScore = null;
        this.data = new Map();
        this.data.set(0, new PoseData('logo', '/poseMatch/images/logo.png'));
        this.data.set(1, new PoseData('countdown3', '/poseMatch/images/3.png'));
        this.data.set(2, new PoseData('countdown2', '/poseMatch/images/2.png'));
        this.data.set(3, new PoseData('countdown1', '/poseMatch/images/1.png'));
        this.data.set(4, new PoseData('pose1', '/poseMatch/images/pose1.png'));
        this.data.set(9, new PoseData('pose2', '/poseMatch/images/pose2.png'));
        this.data.set(14, new PoseData('pose3', '/poseMatch/images/pose3.png'));
        this.data.set(19, new PoseData('stop', null));

        this.server = new PoseMatchServer();
        let gameCanvas = document.querySelector('#game');
        this.viewManager = new PoseMatchViewManager(gameCanvas);
        this.peManager = new PoseEstimationManager(this.data);
        this.poseTimer = new PoseTimer(
            this.viewManager.getGameView(),
            this.data
        );
    }

    init(user, userCollection) {
        this.user = user;
        let myCanvas = document.querySelector('#PoseEstimation');
        this.viewManager.setMyName(user);
        this.viewManager.addUserView(user, myCanvas);

        this.server.init(user, userCollection);
        let readyButton = document.querySelector('#readyButton');
        readyButton.addEventListener('click', function () {
            console.log('pushed ready button');
            readyButton.disabled = true;
            PoseMatch.getInstance().getServer().setState('ready');
        });

        let resultButton = document.querySelector('#resultButton');
        resultButton.addEventListener('click', function () {
            resultDialog.style.display = 'block';
        });
        let closeResultButton = document.getElementsByClassName('close')[0];
        closeResultButton.addEventListener('click', function () {
            resultDialog.style.display = 'none';
        });

        this.server.addListener(function (cmd, data) {
            console.log('[ServerListener]', cmd, data);
            if (cmd == 'ready') {
                PoseMatch.getInstance()
                    .getViewManager()
                    .setState('ready', data);
            } else if (cmd == 'reset') {
                PoseMatch.getInstance().enableReadyButton(true);
                PoseMatch.getInstance()
                    .getViewManager()
                    .setState('reset', data);
            } else if (cmd == 'readyAll') {
                PoseMatch.getInstance().enableResultButton(false);
                PoseMatch.getInstance().getPEManager().start();
                PoseMatch.getInstance().getTimer().start();
                PoseMatch.getInstance()
                    .getViewManager()
                    .setState('readyAll', data);
            } else if (cmd == 'updateRemoteScore') {
                PoseMatch.getInstance()
                    .getViewManager()
                    .setScoreData(
                        PoseMatch.getInstance().getServer().user,
                        PoseMatch.getInstance().getServer().dataMap
                    );
            } else if (cmd == 'createResultPose') {
                console.log('Is this called only once?');
                PoseMatch.getInstance().getPEManager().createResultPose(data);
            }
        });

        this.poseTimer.addListener(function (cmd, data) {
            console.log('[PoseTimerListener]', cmd, data);
            if (cmd.indexOf('pose') >= 0) {
                PoseMatch.getInstance()
                    .getViewManager()
                    .setState('playing', cmd);
                PoseMatch.getInstance()
                    .getPEManager()
                    .updateTargetPE('localvideo', cmd);
            } else if (cmd == 'stop') {
                PoseMatch.getInstance().getViewManager().setState('stop', cmd);
                PoseMatch.getInstance().getPEManager().stop();
                PoseMatch.getInstance().getServer().resetGame();
                PoseMatch.getInstance().enableResultButton(true);
            }

            // TODO: refactoring
            if (cmd == 'pose2') {
                PoseMatch.getInstance().captureAndSaveImg(0);
                PoseMatch.getInstance()
                    .getServer()
                    .setScore(0, PoseMatch.getInstance().currentScore);
            } else if (cmd == 'pose3') {
                PoseMatch.getInstance().captureAndSaveImg(1);
                PoseMatch.getInstance()
                    .getServer()
                    .setScore(1, PoseMatch.getInstance().currentScore);
            } else if (cmd == 'stop') {
                PoseMatch.getInstance().getTimer().stop();
                PoseMatch.getInstance().captureAndSaveImg(2);
                PoseMatch.getInstance()
                    .getServer()
                    .setScore(2, PoseMatch.getInstance().currentScore);
            }
        });

        let peListener = function (cmd, data) {
            if (cmd == 'peLoaded') {
                console.log('[PEListener]', cmd, data);
                PoseMatch.getInstance().enableReadyButton(true);
            } else if (cmd == 'updateScore') {
                let displayScore = document.getElementById('localScore');
                displayScore.innerText = data;
                PoseMatch.getInstance().currentScore = data;
            }
        };

        this.peManager.addListener(function (cmd, data) {
            console.log('[PEManagerListener]', cmd, data);
            if (cmd == 'posenetLoaded') {
                PoseMatch.getInstance()
                    .getPEManager()
                    .createVideoPose(
                        'localvideo',
                        PoseMatch.getInstance().user,
                        true
                    );
                PoseMatch.getInstance()
                    .getPEManager()
                    .setPEListener('localvideo', peListener);
            }
        });
        this.peManager.init();
        this.logTimer = setInterval(
            function (poseMatch) {
                poseMatch.viewManager
                    .getGameView()
                    .draw(poseMatch.data.get(0).img);
                clearInterval(poseMatch.logTimer);
            },
            1000,
            this
        );
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

    enableReadyButton(enable) {
        console.log('enable ready', enable);
        document.getElementById('readyButton').disabled = !enable;
    }

    enableResultButton(enable) {
        document.getElementById('resultButton').disabled = !enable;
    }

    captureAndSaveImg(idx) {
        let canvas = document.createElement('canvas');
        let video = document.getElementById('localvideo');

        canvas.width = video.width;
        canvas.height = video.height;

        canvas
            .getContext('2d')
            .drawImage(video, 0, 0, video.width, video.height);
        let b64str = canvas.toDataURL('imag/png').split(';base64,')[1];
        b64str = b64str.replace(/\+/g, '%2B');

        let imageHostingRequest = new XMLHttpRequest();
        imageHostingRequest.open(
            'POST',
            'https://api.imgbb.com/1/upload?' +
                'expiration=60' +
                '&key=15c781598b3e34982799db6f86a3819f' +
                '&name=' +
                PoseMatch.getInstance().user +
                idx,
            true
        );
        imageHostingRequest.setRequestHeader(
            'Access-Control-Allow-Origin',
            '*'
        );
        imageHostingRequest.setRequestHeader(
            'Access-Control-Allow-Methods',
            'POST'
        );
        imageHostingRequest.setRequestHeader(
            'Content-Type',
            'application/x-www-form-urlencoded'
        );

        imageHostingRequest.send('image=' + b64str);

        imageHostingRequest.onload = function () {
            let result = JSON.parse(imageHostingRequest.response);
            //console.log('image_url=' + encodeURI(result.data.url));
            PoseMatch.getInstance()
                .getServer()
                .setImgUrl(idx, encodeURI(result.data.url));
        };
    }
}
