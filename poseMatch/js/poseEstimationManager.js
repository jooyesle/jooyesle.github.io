const HAVE_ENOUGH_DATA = 4;
const skeleton = [
    [5, 6],
    [5, 7],
    [5, 11],
    [6, 8],
    [6, 12],
    [7, 9],
    [8, 10],
    [11, 12],
    [13, 11],
    [14, 12],
    [15, 13],
    [16, 14],
];
var prev = 0;

class PoseEstimationManager {
    constructor(data) {
        this.targetPoses = new Map();
        this.videoPoses = new Map();
        this.data = data;
        this.listener = null;
        this.prev = 0;
    }

    notifyToListener(cmd, data) {
        if (this.listener != null) {
            this.listener(cmd, data);
        }
    }

    async init() {
        this.net = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 308, height: 234 },
            multiplier: 1.0,
        });

        await this.createTargetPoses();
        this.notifyToListener('posenetLoaded', null);

        var draw = function () {
            if (performance.now() - prev > 100) {
                if (
                    PoseMatch.getInstance().getViewManager().state ==
                        'playing' ||
                    PoseMatch.getInstance().getViewManager().state == 'stop' ||
                    PoseMatch.getInstance().getViewManager().state == 'reset'
                ) {
                    PoseMatch.getInstance().getPEManager().estimate();
                }
                PoseMatch.getInstance().getViewManager().draw();
                prev = performance.now();
            }
            requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);

        // var draw = function () {
        //     if (PoseMatch.getInstance().getViewManager().state == 'playing') {
        //         PoseMatch.getInstance().getPEManager().estimate();
        //     }
        //     PoseMatch.getInstance().getViewManager().draw();
        //     setTimeout(draw, 250);
        // };
        // setTimeout(draw, 250);
    }

    async createTargetPoses() {
        this.data.forEach((value, key, map) => {
            if (value.cmd.indexOf('pose') >= 0) {
                let pe = new GameEstimation(this.net, false);
                pe.init(value.img, value.cmd);
                this.targetPoses.set(value.cmd, pe);
            }
        });
    }

    createVideoPose(videoId, userName, enableCalcScore) {
        if (videoId != 'localvideo') return;
        let vidPose = new VideoEstimation(this.net, enableCalcScore);
        let video = document.getElementById(videoId);
        video.width = 320;
        video.height = 240;

        this.videoPoses.set(videoId, vidPose);

        video.addEventListener('playing', function () {
            if (video.readyState == HAVE_ENOUGH_DATA) {
                vidPose.init(video, userName);
            }
        });
    }

    createResultPose(imgId) {
        let pe = new ResultEstimation(this.net, true);
        let img = document.getElementById(imgId);

        let imgIdStr = imgId.toString();
        console.log(imgIdStr);
        switch ((imgIdStr.slice(-1) - '0') % 3) {
            case 0:
                pe.updateTargetPE(this.targetPoses.get('pose1'));
                break;
            case 1:
                pe.updateTargetPE(this.targetPoses.get('pose2'));
                break;
            case 2:
                pe.updateTargetPE(this.targetPoses.get('pose3'));
                break;
        }

        img.onload = function () {
            pe.init(img, img.id);
        };
    }

    addListener(listener) {
        this.listener = listener;
    }

    setPEListener(name, listener) {
        this.videoPoses.get(name).setListener(listener);
    }

    updateTargetPE(name, pose) {
        console.log('Update Target PE:', name, pose);
        this.videoPoses.get(name).updateTargetPE(this.targetPoses.get(pose));
    }

    estimate() {
        this.videoPoses.forEach((value, key, map) => {
            value.estimate();
        });
    }
}
