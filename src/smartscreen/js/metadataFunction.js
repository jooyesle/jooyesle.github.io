const form = document.getElementById("metadata_input");
form.addEventListener("submit", onSubmit);

class MetaData {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

let x_in = 1;
let y_in = 2;
let z_in = 3;
var gmetadata = null;

function onSubmit(event) {
  x_in = document.getElementById("x_in").value;
  y_in = document.getElementById("y_in").value;
  z_in = document.getElementById("z_in").value;

  myMetaData = new MetaData(x_in, y_in, z_in);
  let myMetaDataStr = JSON.stringify(myMetaData);
  let metadata = new TextEncoder("utf-8").encode(myMetaDataStr);
  gmetadata = metadata;
}

function updateData(metadata) {
    document.getElementById("x_out").value = Number(metadata.x);
    document.getElementById("y_out").value = Number(metadata.y);
    document.getElementById("z_out").value = Number(metadata.z);
}

class MetadataFunction extends InsertableFunction {
    getSenderStream(type) {
        console.log("MetadataFunction: getSenderStream");
        return new TransformStream({transform: pushMetadata});
    }
    
    getReceiverStream(type) {
        console.log("MetadataFunction: getReceiverStream");
        return new TransformStream({transform: popMetadata});
    }
    
    setSenderStream(readableStream, writableStream) {
        readableStream
            .pipeThrough (this.getSenderStream('video'));

    }
}
const metadataFunction = new MetadataFunction();
addFunction('MetadataFunction', metadataFunction);

function getInsertableMetadata() {
  return gmetadata;
}

function onInsertableMetadata(metadata) {
  if (metadata == null) {
      return;
  }
  try {
    let myMetaDataStr = new TextDecoder("utf-8").decode(metadata);
    //console.log(myMetaDataStr);
    let myMetaData = JSON.parse(myMetaDataStr);
    console.log(
      "x : %d, y : %d, z : %d",
      Number(myMetaData.x),
      Number(myMetaData.y),
      Number(myMetaData.z)
    );
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