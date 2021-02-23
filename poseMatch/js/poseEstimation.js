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

const HAVE_ENOUGH_DATA = 4;
const targetSize = 3;
let gNet = null;
let gTargetPose = new Array(targetSize);

class PoseEstimation {
    constructor() {
        this.frame = null;
        this.name = null;
        this.name = null;
        this.keyPoint = new Array(17);
        this.keyVector = new Array(12);
        this.pose = null;
        this.isEstimated = false;
        this.enableDrawSkeleton = false;
        this.interval = null; // only when video
        this.score = 0.0; // true only when localVideo
        this.enableCalcScore = false; // true only when localVideo
    }

    init(frame, name) {
        this.frame = frame;
        this.name = name;
        if (this.frame instanceof HTMLVideoElement) {
            this.estimateVideo();
        } else if (this.frame instanceof HTMLImageElement) {
            this.setEnableCalcScore(false);
            this.setEnableDrawSkeleton(false);
            this.estimateFrame();
        }
    }

    estimateVideo() {
        this.interval = setInterval(async () => {
            if (this.frame.readyState == HAVE_ENOUGH_DATA) {
                await this.estimateFrame();
            } else {
                clearInterval(this.interval);
            }
        }, 100);
    }

    async estimateFrame() {
        try {
            this.pose = await gNet.estimateSinglePose(
                this.frame,
                0.5,
                false,
                16
            );

            this.updateKeyPoint();
            this.updateKeyVector();

            if (!this.isEstimated) {
                this.isEstimated = true;
            }

            if (this.enableDrawSkeleton) {
                PoseMatch.getInstance()
                    .getViewManager().setKeyPoints(this.name, this.getKeyPoint());
            }

            if (this.enableCalcScore) {
                this.calcScore();
            }
        } catch {
            console.log('Error loading pose estimation');
        }
    }

    updateKeyPoint() {
        for (let key in this.pose.keypoints) {
            let x = this.pose.keypoints[key].position.x;
            let y = this.pose.keypoints[key].position.y;
            this.keyPoint[key] = [x, y];
        }
    }

    updateKeyVector() {
        for (let i = 0; i < skeleton.length; i++) {
            this.keyVector[i] = [
                this.keyPoint[skeleton[i][1]][0] -
                    this.keyPoint[skeleton[i][0]][0],
                this.keyPoint[skeleton[i][1]][1] -
                    this.keyPoint[skeleton[i][0]][1],
            ];
        }
    }

    getName() {
        return this.name;
    }
    getKeyVector() {
        return this.keyVector;
    }

    getKeyPoint() {
        return this.keyPoint;
    }

    getIsEstimated() {
        return this.isEstimated;
    }

    setEnableCalcScore(isEnabled) {
        this.enableCalcScore = isEnabled;
    }

    setEnableDrawSkeleton(isEnabled) {
        this.enableDrawSkeleton = isEnabled;
    }

    calcScore() {
        if (this.frame.id != 'localvideo') return;

        let displayScore = document.getElementById('localScore');
        let startTime = 3;
        let intervalTime = 3;
        let curTime = PoseMatch.getInstance().getTimer().index;

        if (
            curTime >= startTime &&
            curTime < startTime + intervalTime * targetSize
        ) {
            let curIdx = Math.floor((curTime - startTime) / intervalTime);
            displayScore.innerText = this.calcCosSim(
                gTargetPose[curIdx].getKeyVector()
            );
        } else {
            displayScore.innerText = '##.#%';
        }
    }

    calcCosSim(vec) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            let dotProduct =
                this.keyVector[i][0] * vec[i][0] +
                this.keyVector[i][1] * vec[i][1];
            let magA = Math.sqrt(
                this.keyVector[i][0] * this.keyVector[i][0] +
                    this.keyVector[i][1] * this.keyVector[i][1]
            );
            let magB = Math.sqrt(vec[i][0] * vec[i][0] + vec[i][1] * vec[i][1]);

            sum += dotProduct / (magA * magB);
        }
        let num = sum / 12;
        num *= 100;

        return num.toFixed(2).toString() + ' %';
    }
}
