this.localVideo = document.querySelector('#localvideo');

localVideo.addEventListener('playing', loadAndUsePoseNet);

let vidVec = [];
let treeVec = [];
let lungeVec = [];
let handstandVec = [];

async function loadAndUsePoseNet() {
    //ResNet (larger, slower, more accurate) **new!**
    /*const rnet = await posenet.load({
    architecture: "ResNet50",
    outputStride: 32,
    inputResolution: { width: 257, height: 200 },
    quantBytes: 2,
  });*/

    //MobileNet (smaller, faster, less accurate)
    const net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 308, height: 234 },
        multiplier: 1.0,
    });

    let readyDone = false;

    setInterval(async () => {
        const poses = await net.estimateSinglePose(localVideo, 0.5, false, 16);
        vidVec = getKeyPoint(poses);
        //drawSkeleton(vidVec, document.getElementById('PoseEstimation'));
        if (!readyDone) {
            document.getElementById('readyButton').disabled = false;
            readyDone = true;
        }

        let displayScore = document.getElementById('localScore');
        let startTime = 3;
        let intervalTime = 3;
        let curTime = gPoseMatch.getTimer().index;
        if (curTime >= startTime && curTime < startTime + intervalTime) {
            displayScore.innerText = calcCosSim(treeVec);
        } else if (
            curTime >= startTime + intervalTime &&
            curTime < startTime + intervalTime * 2
        ) {
            displayScore.innerText = calcCosSim(lungeVec);
        } else if (
            curTime >= startTime + intervalTime * 2 &&
            curTime < startTime + intervalTime * 3
        ) {
            displayScore.innerText = calcCosSim(handstandVec);
        } else {
            displayScore.innerText = '##.#%';
        }
    }, 100);

    //tree
    let tree = new Image(320, 240);
    tree.src = 'images/tree.jpg';
    const treePose = await net.estimateSinglePose(tree, 0.5, false, 16);
    treeVec = getSkeleton(getKeyPoint(treePose));
    //lunge
    let lunge = new Image(320, 240);
    lunge.src = 'images/lunge.jpg';
    const lungePose = await net.estimateSinglePose(lunge, 0.5, false, 16);
    lungeVec = getSkeleton(getKeyPoint(lungePose));
    //handstand
    let handstand = new Image(320, 240);
    handstand.src = 'images/handstand.jpg';
    const handstandPose = await net.estimateSinglePose(
        handstand,
        0.5,
        false,
        16
    );
    handstandVec = getSkeleton(getKeyPoint(handstandPose));

    //console.log(tf.getBackend());
}

let skeleton = [
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

function getKeyPoint(result) {
    let keyPoints = [];

    for (let key in result.keypoints) {
        let x = result.keypoints[key].position.x;
        let y = result.keypoints[key].position.y;
        keyPoints.push([x, y]);
    }

    return keyPoints;
}

function getSkeleton(keyPoints) {
    let keyPointVec = [];

    for (let i = 0; i < skeleton.length; i++) {
        keyPointVec.push([
            keyPoints[skeleton[i][1]][0] - keyPoints[skeleton[i][0]][0],
            keyPoints[skeleton[i][1]][1] - keyPoints[skeleton[i][0]][1],
        ]);
    }
    return keyPointVec;
}

function drawSkeleton(keyPoints, poseCanvas) {
    let ctx = poseCanvas.getContext('2d');
    ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

    let w = 5;
    let h = 5;

    ctx.beginPath();
    for (let i = 0; i < skeleton.length; i++) {
        ctx.moveTo(keyPoints[skeleton[i][0]][0], keyPoints[skeleton[i][0]][1]);
        ctx.lineTo(keyPoints[skeleton[i][1]][0], keyPoints[skeleton[i][1]][1]);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgb(66, 135, 245)';
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = 'rgb(255, 102, 0)';
    for (let i = 0; i < keyPoints.length; i++) {
        ctx.beginPath();
        ctx.ellipse(keyPoints[i][0], keyPoints[i][1], w, h, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}

function calcCosSim(vec) {
    let sum = 0;
    let vidSkeleton = getSkeleton(vidVec);
    for (let i = 0; i < 12; i++) {
        let dotProduct =
            vidSkeleton[i][0] * vec[i][0] + vidSkeleton[i][1] * vec[i][1];
        let magA = Math.sqrt(
            vidSkeleton[i][0] * vidSkeleton[i][0] +
                vidSkeleton[i][1] * vidSkeleton[i][1]
        );
        let magB = Math.sqrt(vec[i][0] * vec[i][0] + vec[i][1] * vec[i][1]);

        sum += dotProduct / (magA * magB);
    }
    let num = sum / 12;
    num *= 100;

    return num.toFixed(2).toString() + ' %';
}
