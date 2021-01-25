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
      const face = await faceapi
        .detectSingleFace(localVideo, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      if (face) {
        gface.x = parseInt(face.detection.box.x);
        gface.y = parseInt(face.detection.box.y);
        gface.w = parseInt(face.detection.box.width);
        gface.h = parseInt(face.detection.box.height);
      } else {
        gface.width = 0;
        gface.height = 0;
      }
      const resizedDetections = faceapi.resizeResults(face, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
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
