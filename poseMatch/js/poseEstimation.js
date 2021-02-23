class PoseEstimation {
    constructor(net, enableCalcScore) {
        this.net = net;
        this.frame = null;
        this.name = null;
        this.keyPoint = new Array(17);
        this.keyVector = new Array(12);
        this.pose = null;
        //this.isEstimated = false;
        //this.enableDrawSkeleton = false;
        this.interval = null; // only when video
        this.score = 0.0; // true only when localVideo
        this.enableCalcScore = enableCalcScore; // true only when localVideo
        this.targetPE = null;
        this.listener = null;
        this.isLoaded = false;
    }

    init(frame, name) {
        console.log('init');
        this.frame = frame;
        this.name = name;
        // if (this.frame instanceof HTMLVideoElement) {
        //     this.estimateVideo();
        // } else if (this.frame instanceof HTMLImageElement) {
        //     this.estimateFrame();
        // }
        this.startup();
    }

    notifyToListener(cmd, data) {
        var msg = [cmd, data];
        if (this.listener != null) {
            this.listener(msg);
        } else {
            console.log('listener error');
        }
    }

    setListener(listener) {
        this.listener = listener;
    }

    async startup() {
        //if (this.interval != null) return;
        //console.log('startup');
        if (this.frame instanceof HTMLVideoElement) {
            this.interval = setInterval(async () => {
                if (this.frame.readyState == HAVE_ENOUGH_DATA) {
                    //console.log('startup video');
                    await this.estimateFrame();
                }
            }, 100);
        } else {
            await this.estimateFrame();
        }
    }

    shutdown() {
        clearInterval(this.interval);
    }

    // estimateVideo() {
    //     this.interval = setInterval(async () => {
    //         if (this.frame.readyState == HAVE_ENOUGH_DATA) {
    //             await this.estimateFrame();
    //         } else {
    //             clearInterval(this.interval);
    //         }
    //     }, 100);
    // }

    updateTargetPE(pe) {
        this.targetPE = pe;
    }

    async estimateFrame() {
        try {
            //console.log(this.net, this.frame);

            this.pose = await this.net.estimateSinglePose(
                this.frame,
                0.5,
                false,
                16
            );
            //console.log(this.pose);
            if (!this.isLoaded) {
                console.log('not loaded');
                this.isLoaded = true;
                this.notifyToListener('loadComplete', null);
                // console.log('listener', this.listener);
                // if (this.listener) {
                //     this.listener('loadComplete', null);
                // }
                // listener ( loadComplete )
            }
            this.updateKeyPoint();
            this.updateKeyVector();
            PoseMatch.getInstance()
                .getViewManager()
                .setKeyPoints(this.name, this.getKeyPoint());

            // if (!this.isEstimated) {
            //     this.isEstimated = true;
            // }

            // if (this.enableDrawSkeleton) {
            //     PoseMatch.getInstance()
            //         .getViewManager()
            //         .setKeyPoints(this.name, this.getKeyPoint());
            // }

            if (this.enableCalcScore) {
                this.calcScore();
            }
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
        if (this.pe == null) return;
        this.score = this.calcCosSim(this.targetPE.getKeyVector());

        this.notifyToListener('updateScore', score);

        // listener( onUpdatedScore (score))

        //    if (this.frame.id != 'localvideo') return;
        //        let displayScore = document.getElementById('localScore');
        // let startTime = 3;
        // let intervalTime = 3;
        // // let curTime = PoseMatch.getInstance().getTimer().index;

        // if (
        //     curTime >= startTime &&
        //     curTime < startTime + intervalTime * targetSize
        // ) {
        //     let curIdx = Math.floor((curTime - startTime) / intervalTime);
        //     displayScore.innerText = this.calcCosSim(
        //         this.targetPE.getKeyVector()
        //     );
        // } else {
        //     displayScore.innerText = '##.#%';
        // }
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

        return num.toFixed(2);
    }
}
