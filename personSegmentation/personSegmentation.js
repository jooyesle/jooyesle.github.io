let video = document.querySelector("video");

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
}

video.addEventListener("playing", loadAndUseBodyPix);

async function loadAndUseBodyPix() {
  // load the BodyPix model from a checkpoint
  const net = await bodyPix.load();

  // arguments for estimating person segmentation.
  const outputStride = 16;
  const segmentationThreshold = 0.5;

  setInterval(async () => {
    const personSegmentation = await net.estimatePersonSegmentation(
      video,
      outputStride,
      segmentationThreshold
    );

    //console.log(personSegmentation);

    const maskBackground = true;
    // Convert the personSegmentation into a mask to darken the background.
    const backgroundDarkeningMask = bodyPix.toMaskImageData(
      personSegmentation,
      maskBackground
    );

    const opacity = 0.7;

    let canvas = document.getElementById("BackgroundErase");
    // draw the mask onto the image on a canvas.  With opacity set to 0.7 this will darken the background.
    bodyPix.drawMask(canvas, video, backgroundDarkeningMask, opacity);
  }, 50);
}
