var enableEncryptVideo = false;
var enableEncryptAudio = false;
var enableDecryptVideo = false;
var enableDecryptAudio = false;

function handleEncryptVideo(checkbox){
    enableEncryptVideo = checkbox.checked;
    console.log('enableEncryptVideo: ' + enableEncryptVideo);
}

function handleEncryptAudio(checkbox){
    enableEncryptAudio = checkbox.checked;
    console.log('enableEncryptAudio: ' + enableEncryptAudio);
}

function handleDecryptVideo(checkbox){
    enableDecryptVideo = checkbox.checked;
    console.log('enableDecryptVideo: ' + enableDecryptVideo);
}

function handleDecryptAudio(checkbox){
    enableDecryptAudio = checkbox.checked;
    console.log('enableDecryptAudio: ' + enableDecryptAudio);
}

class EncryptionFunction extends InsertableFunction {
    getSenderStream(type) {
        if (type === 'video') {
            console.log("EncryptionFunction: getSenderVideoStream");
            return new TransformStream({transform: encryptVideo});
        }
        console.log("EncryptionFunction: getSenderAudioStream");
        return new TransformStream({transform: encryptAudio});
    }
    
    getReceiverStream(type) {
        if (type === 'video') {
            console.log("EncryptionFunction: getReceiverAudioStream");
            return new TransformStream({transform: decryptVideo});
        }
        console.log("EncryptionFunction: getReceiverAudioStream");
        return new TransformStream({transform: decryptAudio});
    }
}
const encryptionFunction = new EncryptionFunction();
addFunction('EncryptionFunction', encryptionFunction);

const xorMask = 0xff;
const additionalSize = 0;
const frameTypeToCryptoOffset = {
    key: 10,
    delta: 3,
    undefined: 1,
};

function encrypt(chunk, flag)
{
    // --- new data ----
    const view = new DataView(chunk.data);
    const newData = new ArrayBuffer(chunk.data.byteLength);
    const newView = new DataView(newData);
    const cryptoOffset = frameTypeToCryptoOffset[chunk.type];

    for (let i = 0; i < chunk.data.byteLength; i++) {
      // --- copy header --
      if (i < cryptoOffset) {
        // just copy
        newView.setInt8(i, view.getInt8(i));
        continue;
      }

      if (flag) {
        // --- invert(XOR) copy ---
        newView.setInt8(i, view.getInt8(i) ^ xorMask);
      }
      else {
        // --- just copy ---
        newView.setInt8(i, view.getInt8(i));
      }
    }

    chunk.data = newData;
}

function decrypt(chunk, flag)
{
     // --- new data ----
    const view = new DataView(chunk.data);
    const newData = new ArrayBuffer(chunk.data.byteLength);
    const newView = new DataView(newData);
    const cryptoOffset = frameTypeToCryptoOffset[chunk.type];

    for (let i = 0; i < chunk.data.byteLength; i++) {
      // --- copy header --
      if (i < cryptoOffset) {
        // -- just copy --
        newView.setInt8(i, view.getInt8(i));
        continue;
      }

      if (flag) {
        // --- invert(XOR) copy ---
        newView.setInt8(i, view.getInt8(i) ^ xorMask);
      }
      else {
        // --- just copy ---
        newView.setInt8(i, view.getInt8(i));
      }
    }
    chunk.data = newData;
}

function encryptVideo(chunk, controller) {
    encrypt(chunk, enableEncryptVideo);
    controller.enqueue(chunk);
}

function decryptVideo(chunk, controller) {
    decrypt(chunk, enableDecryptVideo);
    controller.enqueue(chunk);
}

function encryptAudio(chunk, controller) {
    encrypt(chunk, enableEncryptAudio);
    controller.enqueue(chunk);
}

function decryptAudio(chunk, controller) {
    decrypt(chunk, enableDecryptAudio);
    controller.enqueue(chunk);
}