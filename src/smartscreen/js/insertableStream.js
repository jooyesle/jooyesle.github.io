let functionList = [];

function addFunction(name, func) {
  functionList.push({ name: name, func: func });
  console.log("add function: " + name);
}

class InsertableFunction {
  constructor() {}
  getSenderStream(type) {
    return null;
  }

  getReceiverStream(type) {
    return null;
  }
}

function setupSenderTransform(sender) {
  console.log("insertableStream.js : setupSenderTransform");
  try {
    const senderStreams = sender.createEncodedStreams();
    const readableStream = senderStreams.readableStream;
    const writableStream = senderStreams.writableStream;
    readableStream
      .pipeThrough(functionList[0].func.getSenderStream(sender.track.kind))
      .pipeThrough(functionList[1].func.getSenderStream(sender.track.kind))
      .pipeThrough(functionList[2].func.getSenderStream(sender.track.kind))
      .pipeTo(writableStream);
  } catch (e) {
    console.error(e);
  }
}

function setupReceiverTransform(receiver) {
  console.log("insertableStream.js : setupReceiverTransform");
  try {
    const receiverStreams = receiver.createEncodedStreams();
    const readableStream = receiverStreams.readableStream;
    const writableStream = receiverStreams.writableStream;
    readableStream
      .pipeThrough(functionList[2].func.getReceiverStream(receiver.track.kind))
      .pipeThrough(functionList[1].func.getReceiverStream(receiver.track.kind))
      .pipeThrough(functionList[0].func.getReceiverStream(receiver.track.kind))
      .pipeTo(writableStream);
  } catch (e) {
    console.error(e);
  }
}

function setMetadataToChunk(chunk, metadata) {
  try {
    const prevChunk = chunk.data;
    if (metadata == null) {
      chunk.data = new ArrayBuffer(chunk.data.byteLength + 1);
      const data = new Uint8Array(chunk.data);
      data.set(new Uint8Array(prevChunk), 0);
      data.set(new Uint8Array([0]), prevChunk.byteLength);
      return;
    }

    chunk.data = new ArrayBuffer(
      chunk.data.byteLength + metadata.byteLength + 1
    );
    const data = new Uint8Array(chunk.data);
    data.set(new Uint8Array(prevChunk), 0);
    data.set(new Uint8Array(metadata), prevChunk.byteLength);
    data.set(
      new Uint8Array([metadata.byteLength]),
      prevChunk.byteLength + metadata.byteLength
    );
  } catch (e) {
    console.log(metadata.byteLength);
    console.log(chunk.data.byteLength + metadata.byteLength + 1);
    console.error(e);
  }
}

function getMetadataFromChunk(chunk) {
  try {
    const view = new DataView(chunk.data);
    const metadataLength = view.getUint8(chunk.data.byteLength - 1);
    if (metadataLength == 0) {
      metadata = null;
    } else {
      metadata = chunk.data.slice(
        chunk.data.byteLength - metadataLength - 1,
        chunk.data.byteLength - 1
      );
    }
    chunk.data = chunk.data.slice(
      0,
      chunk.data.byteLength - metadataLength - 1
    );
  } catch (e) {
    console.error(e);
  }
  return metadata;
}
