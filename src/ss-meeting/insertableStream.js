const encryptWorker = new Worker('./worker/encryption.js');
const faceDetectionWorker = new Worker('./worker/faceDetection.js');

function handleEncryption(checkbox){
  if(checkbox.checked == true){
    console.log("insertableStream.js : Encryption enabled");
    encryptWorker.postMessage({
    operation: 'enable',
    });
  } else{
    console.log("insertableStream.js : Encryption disabled");
    encryptWorker.postMessage({
    operation: 'disable',
    });
  }
}

function handleFaceDetection(checkbox){
if(checkbox.checked == true){
    console.log("insertableStream.js : Face Detection enabled");
    faceDetectionWorker.postMessage({
    operation: 'enable',
    });
  } else{
    console.log("insertableStream.js :Face Detection disabled");
    faceDetectionWorker.postMessage({
    operation: 'disable',
    });
  }
}
