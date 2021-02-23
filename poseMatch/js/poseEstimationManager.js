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
        this.targetPoses = [];
        this.videoPoses = new Map();
        this.data = data;

        this.listener = null;
    }

    notifyToListener(cmd, data) {
        var msg = [cmd, data];
        if (this.listener != null) {
            this.listener(msg);
        }
    }

    async init() {
        this.net = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 308, height: 234 },
            multiplier: 1.0,
        });

        console.log(this.net);
        this.createTargetPoses();
        console.log('init lisetner:', this.listener);
        this.notifyToListener('posenetLoaded', null);
    }

    async createTargetPoses() {
        this.data.forEach((value, key, map) => {
            if (value.cmd.indexOf('pose') >= 0) {
                let pe = new PoseEstimation(this.net, false);
                pe.init(value.img, key);
                this.targetPoses.push(pe);
            }
        });
    }

    createVideoPose(videoId, userName, enableCalcScore) {
        console.log('createvp:', videoId, userName);
        let vidPose = new PoseEstimation(this.net, enableCalcScore);
        let video = document.getElementById(videoId);
        this.videoPoses.set(videoId, vidPose);

        // video.width = 320;
        // video.height = 240;

        // if (videoId == 'localvideo') {
        //     /*enable and disable ready button */
        //     check = setInterval(() => {
        //         if (vidPose.getIsEstimated() == true) {
        //             document.getElementById('readyButton').disabled = false;
        //             clearInterval(check);
        //         }
        //     }, 100);

        //     vidPose.setEnableCalcScore(true);
        //     vidPose.setEnableDrawSkeleton(true);
        // } else {
        //     vidPose.setEnableCalcScore(false);
        //     vidPose.setEnableDrawSkeleton(true);
        // }

        video.addEventListener('playing', function () {
            console.log('video: ');
            if (video.readyState == HAVE_ENOUGH_DATA) {
                vidPose.init(video, userName);
            }
        });
    }

    addListener(listener) {
        this.listener = listener;
    }

    setPEListener(name, listener) {
        console.log(this.videoPoses);
        this.videoPoses.get(name).setListener(listener);
    }
}

// function loadTargets() {
//     images = new Array(targetSize);

//     for (let i = 0; i < targetSize; i++) {
//         images[i] = new Image(320, 240); // same as video size
//     }
//     images[0].src = 'images/tree.jpg';
//     images[1].src = 'images/lunge.jpg';
//     images[2].src = 'images/handstand.jpg';

//     for (let i = 0; i < targetSize; i++) {
//         gTargetPose[i] = new PoseEstimation();
//         gTargetPose[i].init(images[i], '');
//     }
// }
