var gPoseMatch = null;

class PoseData {
    constructor(cmd, imgPath) {
        this.cmd = cmd;
        this.img = new Image(320, 240);
        if (imgPath != null) this.img.src = imgPath;
        if (cmd.indexOf('pose') >= 0) this.img.id = cmd;
    }
}

class PoseMatch {
    constructor() {
        this.state = 'notReady';
        this.currentScore = null;
        this.data = new Map();
        this.data.set(
            0,
            new PoseData('logo', 'https://i.ibb.co/mNkZ1QR/logo.png')
        );
        this.data.set(
            1,
            new PoseData('countdown3', 'https://i.ibb.co/Fm8GPfW/3.png')
        );
        this.data.set(
            2,
            new PoseData('countdown2', 'https://i.ibb.co/QJj76kp/2.png')
        );
        this.data.set(
            3,
            new PoseData('countdown1', 'https://i.ibb.co/vq54MxZ/1.png')
        );
        this.data.set(
            4,
            new PoseData('pose1', 'https://i.ibb.co/s22Q6tg/pose1.png')
        );
        this.data.set(
            9,
            new PoseData('pose2', 'https://i.ibb.co/swGpxyb/pose2.png')
        );
        this.data.set(
            14,
            new PoseData('pose3', 'https://i.ibb.co/B6GQkPg/pose3.png')
        );
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
                for (let i = 0; i < data.children.length; i++) {
                    for (
                        let j = 1;
                        j < data.children[i].children.length / 2;
                        j++
                    ) {
                        let resCanvas = data.children[i].children[2 * j - 1];
                        let resImg = data.children[i].children[2 * j];
                        PoseMatch.getInstance()
                            .getViewManager()
                            .addResultView(resImg.id, resCanvas);
                        PoseMatch.getInstance()
                            .getPEManager()
                            .createResultPose(resImg.id);
                    }
                }
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
                //PoseMatch.getInstance().enableReadyButton(true);
            } else if (cmd == 'updateScore') {
                let displayScore = document.getElementById('localScore');
                if (
                    PoseMatch.getInstance().getViewManager().state == 'playing'
                ) {
                    displayScore.innerText = data;
                    PoseMatch.getInstance().currentScore = data;
                } else {
                    displayScore.innerText = '00.00';
                }
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

                PoseMatch.getInstance().enableReadyButton(true);
            }
        });
        this.peManager.init();
        this.logTimer = setInterval(
            function (poseMatch) {
                poseMatch.viewManager
                    .getGameView()
                    .drawImage(poseMatch.data.get(0).img);
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
                'expiration=3600' +
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
