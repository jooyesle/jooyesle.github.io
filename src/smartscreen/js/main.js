let localStream = null;
const localVideo = document.getElementById("local_video");
const remoteVideo = document.getElementById("remote_video");

function printLog(message) {
  var logger = document.getElementById("logbox");
  logger.innerHTML += message + "<br />";
  console.log(message);
}

function getVideoDevice() {
  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length > 0) {
    return "Video device: " + videoTracks[0].label;
  }
  return "Video device: null";
}

function getAudioDevice() {
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    return "Audio device: " + audioTracks[0].label;
  }
  return "Audio device: null";
}

function startVideo() {
  const supportsInsertableStreams = !!RTCRtpSender.prototype
    .createEncodedStreams;
  printLog("supportsInsertableStreams=" + supportsInsertableStreams);

  console.log("startVideo()");
  const constraints = {
    video: { width: localVideo.width, height: localVideo.height },
    audio: true,
  };
  console.log("getUserMedia constraints:", constraints);

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
      localVideo.muted = true;
      localVideo.play().catch((err) => console.error("video play ERROR:", err));
      printLog(getVideoDevice());
      printLog(getAudioDevice());
    })
    .catch((err) => {
      console.error("getUserMedia ERROR:", err);
    });
}

function stopVideo() {
  console.log("stopVideo()");
  if (localVideo.srcObject) {
    localVideo.srcObject.getTracks().forEach((track) => track.stop());
    localVideo.pause();
    localVideo.srcObject = null;
  }
  localStream = null;
}

async function connectInternal() {
  this.pc1.onicecandidate = (e) => {
    if (e.candidate) {
      this.pc2.addIceCandidate(e.candidate);
    } else {
      console.log("pc1 candidate empty");
    }
  };
  this.pc2.onicecandidate = (e) => {
    if (e.candidate) {
      this.pc1.addIceCandidate(e.candidate);
    } else {
      console.log("pc2 candidate empty");
    }
  };

  const offer = await this.pc1.createOffer();
  await this.pc2.setRemoteDescription({ type: "offer", sdp: offer.sdp });
  await this.pc1.setLocalDescription(offer);

  const answer = await this.pc2.createAnswer();
  await this.pc1.setRemoteDescription(answer);
  await this.pc2.setLocalDescription(answer);

  Monitor.getMonitor().addStreamMonitor('local_monitor', 'local_video', pc1, false);
  Monitor.getMonitor().addStreamMonitor('remote_monitor', 'remote_video', pc2, true);
}

function connect() {
  console.log("connect()");
  const useInsertableStream = true;
  this.pc1 = new RTCPeerConnection({
    encodedInsertableStreams: useInsertableStream,
  });
  this.pc2 = new RTCPeerConnection({
    encodedInsertableStreams: useInsertableStream,
  });

  localStream
    .getTracks()
    .forEach((track) => this.pc1.addTrack(track, localStream));
  console.log("Added local stream to pc1");

  this.pc2.ontrack = (evt) => {
    console.log("ontrack");
    if (useInsertableStream) {
      setupReceiverTransform(evt.receiver);
    }
    if (!remoteVideo.srcObject) {
      console.log("remote video play");
      remoteVideo.srcObject = evt.streams[0];
      remoteVideo.play().catch((err) => {
        console.error("play ERROR", err);
      });
    }
  };

  if (useInsertableStream) {
    this.pc1.getSenders().forEach(setupSenderTransform);
  }

  connectInternal();
}

function disconnect() {
  console.log("disconnect()");
  this.pc1.close();
  this.pc2.close();
  remoteVideo.pause();
  remoteVideo.srcObject = null;
  stopVideo();
}
