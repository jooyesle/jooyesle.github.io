self.onmessage = (event) => {
  if (event.data === "load_faceapi_models") {
    self.importScripts("/src/smartscreen/js/face-api/face-api.min.js");
    //self.importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
    /*faceapi.nets.tinyFaceDetector.loadFromUri(
      "/src/smartscreen/js/face-api/models"
    );
    faceapi.nets.faceLandmark68Net.loadFromUri(
      "/src/smartscreen/js/face-api/models"
    );
    faceapi.nets.faceRecognitionNet.loadFromUri(
      "/src/smartscreen/js/face-api/models"
    );
    faceapi.nets.faceExpressionNet.loadFromUri(
      "/src/smartscreen/js/face-api/models"
    );*/
  }
};
