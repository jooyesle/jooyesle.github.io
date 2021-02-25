class PoseEstimation {
    constructor(net, enableCalcScore) {
        this.net = net;
        this.frame = null;
        this.name = null;
        this.keyPoint = new Array(17);
        this.keyVector = new Array(12);
        this.pose = null;
        this.interval = null;
        this.score = 0.0;
        this.enableCalcScore = enableCalcScore;
        this.targetPE = null;
        this.listener = null;
        this.isLoaded = false;
    }

    init(frame, name) {
        this.frame = frame;
        this.name = name;
        this.start();
    }

    notifyToListener(cmd, data) {
        if (this.listener != null) {
            this.listener(cmd, data);
        } else {
            console.log('listener error : cmd was ' + cmd);
        }
    }

    setListener(listener) {
        this.listener = listener;
    }

    async start() {
        if (this.interval != null) return;
        if (this.frame instanceof HTMLVideoElement) {
            this.interval = setInterval(async () => {
                if (this.frame.readyState == HAVE_ENOUGH_DATA) {
                    await this.estimateFrame();

                    if (!this.isLoaded) {
                        console.log('This is the first load for ' + this.name);
                        this.isLoaded = true;
                        this.notifyToListener('peLoaded', null);
                    }

                    let userView = PoseMatch.getInstance()
                        .getViewManager()
                        .getUserView(this.name);

                    userView.setKeyPoints(this.getKeyPoint());
                    userView.setKeyVectors(this.getKeyVector());

                    if (this.enableCalcScore) {
                        this.calcScore();
                    }
                }
            }, 100);
        } else {
            await this.estimateFrame();
        }
    }

    stop() {
        clearInterval(this.interval);
    }

    updateTargetPE(pe) {
        this.targetPE = pe;
    }

    async estimateFrame() {
        try {
            this.pose = await this.net.estimateSinglePose(
                this.frame,
                0.5,
                false,
                16
            );

            this.updateKeyPoint();
            this.updateKeyVector();
        } catch {
            console.log(this.name + 'Error loading pose estimation');
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
                0.0,
            ];
        }
    }

    getKeyVector() {
        return this.keyVector;
    }

    getKeyPoint() {
        return this.keyPoint;
    }

    calcScore() {
        if (this.targetPE == null) return;
        this.score = this.calcCosSim(this.targetPE.getKeyVector());
        this.notifyToListener('updateScore', this.score);
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

            this.keyVector[i][2] = dotProduct / (magA * magB);
            sum += this.keyVector[i][2];
        }

        let avgCosSim = sum / 12;
        avgCosSim *= 100;

        return avgCosSim.toFixed(2);
    }
}
