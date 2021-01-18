class MetaData {
        constructor(x, y, z){
                this.x = x;
                this.y = y;
                this.z = z;
        }
}

let localStream = null;
const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');

function printLog(message) {
        var logger = document.getElementById('logbox');
        logger.innerHTML += message + '<br />';
        console.log(message);
}

function getVideoDevice() {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
                    return 'Video device: ' + videoTracks[0].label;
                }
        return 'Video device: null';
}

function getAudioDevice() {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
                    return 'Audio device: ' + audioTracks[0].label;
                }
        return 'Audio device: null';
}

function startVideo() {
      const supportsInsertableStreams = !!RTCRtpSender.prototype.createEncodedStreams;
      printLog('supportsInsertableStreams=' + supportsInsertableStreams);

      console.log('startVideo()');
      const constraints = { video: { width: 640, height: 480 }, audio: true };
      console.log('getUserMedia constraints:', constraints);

      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
                  localStream = stream;
                  localVideo.srcObject = stream;
                  localVideo.muted = true;
                  localVideo.play().catch(err => console.error('video play ERROR:', err));
                  printLog(getVideoDevice());
                  printLog(getAudioDevice());
                })
        .catch(err => {
                  console.error('getUserMedia ERROR:', err);
                });
}

function stopVideo() {
      console.log('stopVideo()');
      if (localVideo.srcObject) {
              localVideo.srcObject.getTracks().forEach(track => track.stop());
              localVideo.pause();
              localVideo.srcObject = null;
            }
      localStream = null;
}

function setMetadataToChunk(chunk, metadata) {
        try {
                    const frame = chunk.data;
                    chunk.data = new ArrayBuffer(chunk.data.byteLength + metadata.byteLength + 1);
                    const data = new Uint8Array (chunk.data);
                    data.set(new Uint8Array (frame), 0);
                    data.set(new Uint8Array (metadata), frame.byteLength);
                    data.set(new Uint8Array ([metadata.byteLength]), frame.byteLength + metadata.byteLength);
                } catch(e) {
                            console.error(e);
                        }
}

function getMetadataFromChunk(chunk) {
        try {
                    const view = new DataView (chunk.data);
                    const metadataLength = view.getUint8(chunk.data.byteLength-1);
                    metadata = chunk.data.slice(chunk.data.byteLength - metadataLength - 1, chunk.data.byteLength - 1)
                    chunk.data = chunk.data.slice(0, chunk.data.byteLength - metadataLength -1)   
                    return metadata;
                } catch(e) {
                            console.error(e);
                        }
        return null;
}

function getInsertableMetadata() {
        myMetaData = new MetaData(1000, 2000, 30);
        //console.log(JSON.stringify(myMetaData));
        let myMetaDataStr = JSON.stringify(myMetaData);
        //console.log(new TextEncoder().encode(myMetaDataStr).byteLength);
        let metadata = Uint8Array.from(myMetaDataStr);
        /*
        let metadata = new ArrayBuffer (5);
        const view = new DataView(metadata)
        view.setUint16 (0, 1000);
        view.setUint16 (2, 2000);
        view.setUint8 (4, 30);
        */
        return metadata;
}

function onInsertableMetadata(metadata) {
        try {
                    let myMetaData = JSON.parse(metadata);
                    console.log(myMetaData);
                    //console.log('x : %d, y : %d, z : %d', metadata.x, metadata.y, metadata.z);
                    /*
                    const view = new DataView(metadata);
                    const x = view.getUint16(0);
                    const y = view.getUint16(2);
                    const z = view.getUint8(4);
                    console.log('x : %d, y : %d, z : %d', x, y, z);
                    */
                } catch(e) {
                            console.error(e);
                        }
}

function encodeFunction(chunk, controller) {
        setMetadataToChunk(chunk, getInsertableMetadata());
        controller.enqueue(chunk);
}

function decodeFunction(chunk, controller) {
        onInsertableMetadata(getMetadataFromChunk(chunk));
        controller.enqueue(chunk);
}

function setupSenderTransform(sender) {
        console.log('sender kind=' + sender.track.kind);
        const senderStreams = sender.createEncodedStreams();
        const readableStream = senderStreams.readableStream;
        const writableStream = senderStreams.writableStream;

        const transformStream = new TransformStream({
                  transform: encodeFunction,
                });
        readableStream
          .pipeThrough(transformStream)
          .pipeTo(writableStream);
}
 
function setupReceiverTransform(receiver) {
        console.log('receiver kind=' + receiver.track.kind);
        const receiverStreams = receiver.createEncodedStreams();
        const readableStream = receiverStreams.readableStream;
        const writableStream = receiverStreams.writableStream;

        const transformStream = new TransformStream({
                  transform: decodeFunction,
                });
        readableStream
          .pipeThrough(transformStream)
          .pipeTo(writableStream);
}

async function connectInernal() {
        this.pc1.onicecandidate = e => {
                    if (e.candidate) {
                                  this.pc2.addIceCandidate(e.candidate);
                                }
                    else {
                                  console.log('pc1 candidate empty');
                                }
                }
        this.pc2.onicecandidate = e => {
                    if (e.candidate) {
                                  this.pc1.addIceCandidate(e.candidate);
                                }
                    else {
                                  console.log('pc2 candidate empty');
                                }
                }

        const offer = await this.pc1.createOffer();
        await this.pc2.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
        await this.pc1.setLocalDescription(offer);

        const answer = await this.pc2.createAnswer();
        await this.pc1.setRemoteDescription(answer);
        await this.pc2.setLocalDescription(answer);
}

function connect() {
        console.log('connect()');
        const useInsertableStream = true;    
        this.pc1 = new RTCPeerConnection({encodedInsertableStreams: useInsertableStream});
        this.pc2 = new RTCPeerConnection({encodedInsertableStreams: useInsertableStream});
        
        localStream.getTracks().forEach(track => this.pc1.addTrack(track, localStream));
        console.log('Added local stream to pc1');
        
        this.pc2.ontrack = evt => {
                    console.log('ontrack');
                    if (useInsertableStream) {
                                    setupReceiverTransform(evt.receiver);
                                }
                    if (!remoteVideo.srcObject) {
                                    console.log('remote video play');
                                    remoteVideo.srcObject = evt.streams[0];
                                    remoteVideo.play().catch(err => { console.error('play ERROR', err) });
                                }
                }
        
        if (useInsertableStream) {
                    this.pc1.getSenders().forEach(setupSenderTransform);
                }

        connectInernal();
}

function disconnect() {
        console.log('disconnect()');
        this.pc1.close();
        this.pc2.close();
        remoteVideo.pause();
        remoteVideo.srcObject = null;
        stopVideo();
}

