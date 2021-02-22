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

function createVideoPose(videoId, userName) {
    let vidPose = new PoseEstimation();
    let video = document.getElementById(videoId);
    video.width = 320;
    video.height = 240;

    if (videoId == 'localvideo') {
        /*enable and disable ready button */
        check = setInterval(() => {
            if (vidPose.getIsEstimated() == true) {
                document.getElementById('readyButton').disabled = false;
                clearInterval(check);
            }
        }, 100);

        vidPose.setEnableCalcScore(true);
        vidPose.setEnableDrawSkeleton(true);
    } else {
        vidPose.setEnableCalcScore(false);
        vidPose.setEnableDrawSkeleton(true);
    }

    video.addEventListener('playing', function () {
        if (video.readyState == HAVE_ENOUGH_DATA) {
            vidPose.init(video, userName);
        }
    });
}
