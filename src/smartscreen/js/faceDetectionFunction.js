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

localVideo.onplaying = () => {
  faceDetection.disabled = false;
  setFaceDetectionInterval.disabled = false;
};

class FaceDetectionFunction extends InsertableFunction {
  getSenderStream(type) {
    console.log("FaceDetectionFunction: getSenderStream");
    return new TransformStream({ transform: pushFacedata });
  }

  getReceiverStream(type) {
    console.log("FaceDetectionFunction: getReceiverStream");
    return new TransformStream({ transform: popFacedata });
  }
}

class Face {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

/* from UI */
let faceDetection = document.getElementById("faceDetection");
let setFaceDetectionInterval = document.getElementById("faceDetectionInterval");

/* create faceDetectionFunction and add to functionList */
const faceDetectionFunction = new FaceDetectionFunction();
addFunction("FaceDetectionFunction", faceDetectionFunction);

/* encoded Face data to be send */
let faceEncoded = null;

function handleFaceDetection(checkbox) {
  console.log("enableFaceDetection: " + checkbox.checked);
  faceDetectionfunc(checkbox.checked);
  if (checkbox.checked) {
    face0.disabled = false;
    face1.disabled = false;
    face2.disabled = false;
    face3.disabled = false;
    faceDrawer.start();
  } else {
    face0.disabled = true;
    face1.disabled = true;
    face2.disabled = true;
    face3.disabled = true;
    faceDrawer.stop();
  }
}

function handleSelectFaceImage(radio) {
  console.log('selected face:' + radio.value);
  if (radio.value === 'face0') {
    faceDrawer.selectFaceImage(0);
  } else if (radio.value === 'face1') {
    faceDrawer.selectFaceImage(1);
  } else if (radio.value === 'face2') {
    faceDrawer.selectFaceImage(2);
  } else {
    faceDrawer.selectFaceImage(3);
  }
}

let interval = -1;
let localCanvas = document.getElementById("local_canvas");
let remoteCanvas = document.getElementById("remote_canvas");
var faceDrawer = new FaceDrawer(remoteCanvas);

function faceDetectionfunc(enabled) {
  if (enabled) {
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

      myFaceData = new Face(0, 0, 0, 0);
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

        myFaceData.x = parseInt(singleResult.detection._box._x);
        myFaceData.y = parseInt(singleResult.detection._box._y);
        myFaceData.w = parseInt(singleResult.detection._box._width);
        myFaceData.h = parseInt(singleResult.detection._box._height);
      } else {
        myFaceData.w = 0;
        myFaceData.h = 0;
      }

      let FaceStr = JSON.stringify(myFaceData);
      faceEncoded = new TextEncoder("utf-8").encode(FaceStr);
    }, setFaceDetectionInterval.value);
  } else {
    setFaceDetectionInterval.disabled = false;
    if (interval >= 0) {
      localCanvas.width = 0;
      clearInterval(interval);
    }
  }
}

function getFaceEncoded() {
  return faceEncoded;
}

function onInsertableFaceData(received) {
  if (received == null) {
    return;
  }
  try {
    let faceStr = new TextDecoder("utf-8").decode(received);
    //drawRemoteFaceDetection(JSON.parse(faceStr));
    let myMetaData = JSON.parse(faceStr);
    rFace = new Face(
      Number(myMetaData.x),
      Number(myMetaData.y),
      Number(myMetaData.w),
      Number(myMetaData.h)
    );
    faceDrawer.updateFaceData(rFace);
  } catch (e) {
    console.error(e);
  }
}

/* reset UI when face detection is disabled */
function resetFaceDetection() {
  if (interval >= 0) {
    localCanvas.width = 0;
    remoteCanvas.width = 0;
    clearInterval(interval);
  }
  setFaceDetectionInterval.disabled = true;
  faceDetection.checked = false;
  faceDetection.disabled = true;
}

function pushFacedata(chunk, controller) {
  setMetadataToChunk(chunk, getFaceEncoded());
  controller.enqueue(chunk);
}

function popFacedata(chunk, controller) {
  onInsertableFaceData(getMetadataFromChunk(chunk));
  controller.enqueue(chunk);
}
