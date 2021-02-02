class SimpleFunction extends InsertableFunction {
  getSenderStream(type) {
    console.log("SimpleFunction: getSenderStream");
    return new TransformStream({ transform: pushSimpleData });
  }

  getReceiverStream(type) {
    console.log("SimpleFunction: getReceiverStream");
    return new TransformStream({ transform: popSimpleData });
  }
}

class Simple {
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
}

/* from UI */
const form = document.getElementById("simpledata_input");
form.addEventListener("submit", onSubmit);

/* create SimpleFunction and add to functionList */
const simpleFunction = new SimpleFunction();
addFunction("SimpleFunction", simpleFunction);

/* encoded Simple data to be send */
let simpleEncoded = null;

function onSubmit(event) {
  simple = new Simple(
    document.getElementById("a_in").value,
    document.getElementById("b_in").value,
    document.getElementById("c_in").value
  );
  let simpleStr = JSON.stringify(simple);
  simpleEncoded = new TextEncoder("utf-8").encode(simpleStr);
}

function updateData(simpleData) {
  document.getElementById("a_out").value = Number(simpleData.a);
  document.getElementById("b_out").value = Number(simpleData.b);
  document.getElementById("c_out").value = Number(simpleData.c);
}

function getSimpleEncoded() {
  return simpleEncoded;
}

function onInsertableSimpleData(received) {
  if (received == null) {
    return;
  }
  try {
    let simpleStr = new TextDecoder("utf-8").decode(received);
    updateData(JSON.parse(simpleStr));
  } catch (e) {
    console.error(e);
  }
}

function pushSimpleData(chunk, controller) {
  setMetadataToChunk(chunk, getSimpleEncoded());
  controller.enqueue(chunk);
}

function popSimpleData(chunk, controller) {
  onInsertableSimpleData(getMetadataFromChunk(chunk));
  controller.enqueue(chunk);
}
