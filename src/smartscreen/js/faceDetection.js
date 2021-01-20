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
  setFaceDetectionInterval.disabled = true;
};

let canvas = new Object();

function handleEnableFaceDetection(checkbox) {
  console.log("enableFaceDetection: " + checkbox.checked);
  if (checkbox.checked) {
    canvas = faceapi.createCanvasFromMedia(localVideo);
    document.body.append(canvas);
    const displaySize = {
      width: localVideo.width,
      height: localVideo.height,
    };
    faceapi.matchDimensions(canvas, displaySize);
    interval = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(localVideo, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, setFaceDetectionInterval.value);
  } else {
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
  faceDetection.checked = false;
  faceDetection.disabled = true;
  setFaceDetectionInterval.disabled = false;
}
