const form = document.getElementById("metadata_input");
form.addEventListener("submit", onSubmit);

class Face {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

class MetaData {
  constructor(a, b, c, face) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.face = face;
  }
}

var gmetadata = null;

let a_in = 0;
let b_in = 0;
let c_in = 0;
let gface = new Face(0, 0, 0, 0);

function onSubmit(event) {
  a_in = document.getElementById("a_in").value;
  b_in = document.getElementById("b_in").value;
  c_in = document.getElementById("c_in").value;
  myMetaData = new MetaData(a_in, b_in, c_in, gface);
  let myMetaDataStr = JSON.stringify(myMetaData);
  let metadata = new TextEncoder("utf-8").encode(myMetaDataStr);
  gmetadata = metadata;
}

function updateData(metadata) {
  document.getElementById("a_out").value = Number(metadata.a);
  document.getElementById("b_out").value = Number(metadata.b);
  document.getElementById("c_out").value = Number(metadata.c);
}

class MetadataFunction extends InsertableFunction {
  getSenderStream(type) {
    console.log("MetadataFunction: getSenderStream");
    return new TransformStream({ transform: pushMetadata });
  }

  getReceiverStream(type) {
    console.log("MetadataFunction: getReceiverStream");
    return new TransformStream({ transform: popMetadata });
  }

  setSenderStream(readableStream, writableStream) {
    readableStream.pipeThrough(this.getSenderStream("video"));
  }
}
const metadataFunction = new MetadataFunction();
addFunction("MetadataFunction", metadataFunction);

function getInsertableMetadata() {
  return gmetadata;
}

function onInsertableMetadata(metadata) {
  if (metadata == null) {
    return;
  }
  try {
    let myMetaDataStr = new TextDecoder("utf-8").decode(metadata);
    let myMetaData = JSON.parse(myMetaDataStr);
    /*console.log(
      "a : %d, b : %d, c : %d",
      Number(myMetaData.a),
      Number(myMetaData.b),
      Number(myMetaData.c)
    );
    console.log(
      "x : %d, y : %d, w : %d, h : %d",
      Number(myMetaData.face.x),
      Number(myMetaData.face.y),
      Number(myMetaData.face.w),
      Number(myMetaData.face.h)
    );*/
    let remoteCanvas = document.getElementById("remote_canvas");
    let ctx = remoteCanvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgb(255, 102, 0)";
    ctx.clearRect(0, 0, remoteCanvas.width, remoteCanvas.height);
    rFace = new Face(
      Number(myMetaData.face.x),
      Number(myMetaData.face.y),
      Number(myMetaData.face.w),
      Number(myMetaData.face.h)
    );
    /*ctx.strokeRect(
      Number(myMetaData.face.x),
      Number(myMetaData.face.y),
      Number(myMetaData.face.w),
      Number(myMetaData.face.h)
    );*/
    ctx.beginPath();
    ctx.ellipse(
      rFace.x + rFace.w / 2,
      rFace.y + rFace.h / 2,
      rFace.w / 2,
      rFace.h / 2,
      0,
      0,
      2 * Math.PI
    );
    ctx.stroke();
    ctx.closePath();
    updateData(myMetaData);
  } catch (e) {
    console.error(e);
  }
}

function pushMetadata(chunk, controller) {
  setMetadataToChunk(chunk, getInsertableMetadata());
  controller.enqueue(chunk);
}

function popMetadata(chunk, controller) {
  onInsertableMetadata(getMetadataFromChunk(chunk));
  controller.enqueue(chunk);
}
