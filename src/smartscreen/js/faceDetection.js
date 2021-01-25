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

let localCanvas = document.getElementById("local_canvas");

function handleEnableFaceDetection(checkbox) {
  console.log("enableFaceDetection: " + checkbox.checked);
  if (checkbox.checked) {
    setFaceDetectionInterval.disabled = true;
    const displaySize = {
      width: localVideo.width,
      height: localVideo.height,
    };
    faceapi.matchDimensions(localCanvas, displaySize);
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
        localCanvas
          .getContext("2d")
          .clearRect(0, 0, localCanvas.width, localCanvas.height);
        faceapi.draw.drawDetections(localCanvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(localCanvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(localCanvas, resizedDetections);

        gface.x = parseInt(singleResult.detection._box._x);
        gface.y = parseInt(singleResult.detection._box._y);
        gface.w = parseInt(singleResult.detection._box._width);
        gface.h = parseInt(singleResult.detection._box._height);
      } else {
        gface.w = 0;
        gface.h = 0;
      }
      //???????
      a_in = document.getElementById("a_in").value;
      b_in = document.getElementById("b_in").value;
      c_in = document.getElementById("c_in").value;
      myMetaData = new MetaData(a_in, b_in, c_in, gface);
      let myMetaDataStr = JSON.stringify(myMetaData);
      let metadata = new TextEncoder("utf-8").encode(myMetaDataStr);
      gmetadata = metadata;
      //????????
    }, setFaceDetectionInterval.value);
  } else {
    setFaceDetectionInterval.disabled = false;
    if (interval >= 0) {
      localCanvas.width = 0;
      clearInterval(interval);
    }
  }
}

function resetFaceDetection() {
  if (interval >= 0) {
    localCanvas.width = 0;
    clearInterval(interval);
  }
  setFaceDetectionInterval.disabled = true;
  faceDetection.checked = false;
  faceDetection.disabled = true;
}
