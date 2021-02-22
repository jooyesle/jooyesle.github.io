async function loadAndUsePoseNet() {
    gNet = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 308, height: 234 },
        multiplier: 1.0,
    });

    loadTargets();
}

function loadTargets() {
    images = new Array(targetSize);

    for (let i = 0; i < targetSize; i++) {
        images[i] = new Image(320, 240); // same as video size
    }
    images[0].src = 'images/tree.jpg';
    images[1].src = 'images/lunge.jpg';
    images[2].src = 'images/handstand.jpg';

    for (let i = 0; i < targetSize; i++) {
        gTargetPose[i] = new PoseEstimation();
        gTargetPose[i].init(images[i], '');
    }
}

function createLocalPose(video, userName) {
    gLocalPose = new PoseEstimation();
    gLocalPose.setEnableCalcScore(true);
    gLocalPose.setEnableDrawSkeleton(true);
    gLocalPose.init(video, userName);

    check = setInterval(() => {
        if (gLocalPose.getIsEstimated() == true) {
            document.getElementById('readyButton').disabled = false;
            clearInterval(check);
        }
    }, 100);
}

function createRemotePose(video, userName) {
    let remotePose = new PoseEstimation();
    remotePose.setEnableCalcScore(false);
    remotePose.setEnableDrawSkeleton(true);
    remotePose.init(video, userName);
}
