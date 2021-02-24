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

class PoseEstimationManager {
    constructor(data) {
        this.targetPoses = new Map();
        this.videoPoses = new Map();
        this.data = data;
        this.listener = null;
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

        this.notifyToListener('posenetLoaded', null);
        this.createTargetPoses();
    }

    async createTargetPoses() {
        this.data.forEach((value, key, map) => {
            if (value.cmd.indexOf('pose') >= 0) {
                /*if (!value.img.complete) {
                    console.log('Target image is not loaded');
                    return;
                }*/
                let pe = new PoseEstimation(this.net, false);
                pe.init(value.img, key);
                this.targetPoses.set(value.cmd, pe);
            }
        });
    }

    createVideoPose(videoId, userName, enableCalcScore) {
        let vidPose = new PoseEstimation(this.net, enableCalcScore);
        let video = document.getElementById(videoId);
        this.videoPoses.set(videoId, vidPose);

        video.addEventListener('playing', function () {
            if (video.readyState == HAVE_ENOUGH_DATA) {
                vidPose.init(video, userName);
            }
        });
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

    stop() {
        this.videoPoses.forEach((value, key, map) => {
            value.stop();
        });
    }
}

// TO DO : for remote video
// video.width = 320;
// video.height = 240;
