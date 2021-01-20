const localVideo = document.getElementById("local_video");

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
]).then(startVideo);

localVideo.addEventListener("playing", () => {
  const canvas = faceapi.createCanvasFromMedia(localVideo);
  document.body.append(canvas);
  const displaySize = { width: localVideo.width, height: localVideo.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(localVideo, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    //console.log(detections);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 500);
});
