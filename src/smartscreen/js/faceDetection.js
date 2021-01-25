let faceDetection = document.getElementById("faceDetection");
let setFaceDetectionInterval = document.getElementById("faceDetectionInterval");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(
    "/src/smartscreen/js/face-api/models"
  ),
  faceapi.nets.faceLandmark68Net.loadFromUri(
    "/src/smartscreen/js/face-api/models"
  ),
  faceapi.nets.faceRecognitionNet.loadFromUri(
    "/src/smartscreen/js/face-api/models"
  ),
  faceapi.nets.faceExpressionNet.loadFromUri(
    "/src/smartscreen/js/face-api/models"
  ),
]).then();

let interval = -1;

localVideo.onplaying = () => {
  faceDetection.disabled = false;
  setFaceDetectionInterval.disabled = false;
};

let canvas = new Object();

function handleEnableFaceDetection(checkbox) {
  console.log("enableFaceDetection: " + checkbox.checked);
  if (checkbox.checked) {
    setFaceDetectionInterval.disabled = true;
    canvas = faceapi.createCanvasFromMedia(localVideo);
    document.body.append(canvas);
    const displaySize = {
      width: localVideo.width,
      height: localVideo.height,
    };
    faceapi.matchDimensions(canvas, displaySize);
    interval = setInterval(async () => {
      const singleResult = await faceapi
        .detectSingleFace(localVideo, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (singleResult) {
        const resizedDetections = faceapi.resizeResults(
          singleResult,
          displaySize
        );
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        gface.x = parseInt(singleResult.detection._box._x);
        gface.y = parseInt(singleResult.detection._box._y);
        gface.w = parseInt(singleResult.detection._box._width);
        gface.h = parseInt(singleResult.detection._box._height);
      } else {
        gface.w = 0;
        gface.h = 0;
      }
    }, setFaceDetectionInterval.value);
  } else {
    setFaceDetectionInterval.disabled = false;
    if (interval >= 0) {
      canvas.width = 0;
      clearInterval(interval);
    }
  }
}

function resetFaceDetection() {
  if (interval >= 0) {
    canvas.width = 0;
    clearInterval(interval);
  }
  setFaceDetectionInterval.disabled = true;
  faceDetection.checked = false;
  faceDetection.disabled = true;
}
