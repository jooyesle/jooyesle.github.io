const rainbow = [
  [110, 64, 170],
  [106, 72, 183],
  [100, 81, 196],
  [92, 91, 206],
  [84, 101, 214],
  [75, 113, 221],
  [66, 125, 224],
  [56, 138, 226],
  [48, 150, 224],
  [40, 163, 220],
  [33, 176, 214],
  [29, 188, 205],
  [26, 199, 194],
  [26, 210, 182],
  [28, 219, 169],
  [33, 227, 155],
  [41, 234, 141],
  [51, 240, 128],
  [64, 243, 116],
  [79, 246, 105],
  [96, 247, 97],
  [115, 246, 91],
  [134, 245, 88],
  [155, 243, 88],
];

let video = document.querySelector("video");
video.addEventListener("playing", loadAndUseBodyPix);

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (error) {
      console.log("Something went wrong!");
    });
}

const opacity = 0.7;

async function loadAndUseBodyPix() {
  // load the BodyPix model from a checkpoint
  const net = await bodyPix.load();

  setInterval(async () => {
    // arguments for estimating person segmentation.
    const outputStride = 16;
    const segmentationThreshold = 0.5;

    // person segmentation
    const personSegmentation = await net.estimatePersonSegmentation(
      video,
      outputStride,
      segmentationThreshold
    );
    const maskBackground = true;
    const backgroundDarkeningMask = bodyPix.toMaskImageData(
      personSegmentation,
      maskBackground
    );

    let person = document.getElementById("PersonEstimation");
    bodyPix.drawMask(person, video, backgroundDarkeningMask, opacity);
  }, 100);

  setInterval(async () => {
    // part segmentation
    const partSegmentation = await net.estimatePartSegmentation(video);
    const coloredPartImage = bodyPix.toColoredPartImageData(
      partSegmentation,
      rainbow
    );
    let part = document.getElementById("PartSegmentation");
    bodyPix.drawMask(part, video, coloredPartImage, opacity);
  }, 100);
}