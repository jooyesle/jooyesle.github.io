let video = document.querySelector("#localvideo");

video.addEventListener("playing", loadAndUsePoseNet);

// into class
let vidVec = [];
let treeVec = [];
let lungeVec = [];
let handstandVec = [];

let treeRes = document.getElementById("res1");
let lungeRes = document.getElementById("res2");
let handstandRes = document.getElementById("res3");

async function loadAndUsePoseNet() {
  //ResNet (larger, slower, more accurate) **new!**
  /*const rnet = await posenet.load({
    architecture: "ResNet50",
    outputStride: 32,
    inputResolution: { width: 257, height: 200 },
    quantBytes: 2,
  });*/

  //MobileNet (smaller, faster, less accurate)
  const net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: { width: 308, height: 234 },
    multiplier: 1.0,
  });

  let readyDone = false;
  //video
  setInterval(async () => {
    /*const poses = await net.estimateMultiplePoses(video, {
      flipHorizontal: false,
      maxDetections: 1,
      scoreThreshold: 0.5,
      nmsRadius: 20,
    });*/
    const poses = await net.estimateSinglePose(video, 0.5, false, 16);
    drawSkeleton(poses, document.getElementById("PoseEstimation"));
    if (!readyDone) {
      document.getElementById("readyButton").disabled = false;
      readyDone = true;
    }

    //calcCosSim(treeVec, treeRes);
    //calcCosSim(lungeVec, lungeRes);
    //calcCosSim(handstandVec, handstandRes);
  }, 100);

  /*
  //tree
  let tree = document.getElementById("tree");
  const treePose = await net.estimateSinglePose(tree, 0.5, false, 16);
  drawSkeleton(treePose, document.getElementById("treeCanvas"));

  //lunge
  let lunge = document.getElementById("lunge");
  const lungePose = await net.estimateSinglePose(lunge, 0.5, false, 16);
  drawSkeleton(lungePose, document.getElementById("lungeCanvas"));

  //handstand
  let handstand = document.getElementById("handstand");
  const handstandPose = await net.estimateSinglePose(handstand, 0.5, false, 16);
  drawSkeleton(handstandPose, document.getElementById("handstandCanvas"));

  console.log(tf.getBackend());
  */
}

function drawSkeleton(result, poseCanvas) {
  let skeleton = [
    /*[0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 4],*/
    [5, 6],
    [5, 7],
    [5, 11],
    [6, 8],
    [6, 12],
    [7, 9],
    [8, 10],
    [11, 12],
    [13, 11],
    [14, 12],
    [15, 13],
    [16, 14],
  ];

  let ctx = poseCanvas.getContext("2d");
  ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

  let w = 5;
  let h = 5;

  let keyPoints = [];

  for (let key in result.keypoints) {
    let x = result.keypoints[key].position.x;
    let y = result.keypoints[key].position.y;
    keyPoints.push([x, y]);
  }

  let vec = [];

  ctx.beginPath();
  for (let i = 0; i < skeleton.length; i++) {
    ctx.moveTo(keyPoints[skeleton[i][0]][0], keyPoints[skeleton[i][0]][1]);
    ctx.lineTo(keyPoints[skeleton[i][1]][0], keyPoints[skeleton[i][1]][1]);
    vec.push([
      keyPoints[skeleton[i][1]][0] - keyPoints[skeleton[i][0]][0],
      keyPoints[skeleton[i][1]][1] - keyPoints[skeleton[i][0]][1],
    ]);
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgb(66, 135, 245)";
  ctx.stroke();
  ctx.closePath();

  ctx.fillStyle = "rgb(255, 102, 0)";
  for (let i = 0; i < keyPoints.length; i++) {
    ctx.beginPath();
    ctx.ellipse(keyPoints[i][0], keyPoints[i][1], w, h, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
  switch (poseCanvas.id) {
    case "PoseEstimation":
      vidVec = vec;
      break;
    case "treeCanvas":
      treeVec = vec;
      break;
    case "lungeCanvas":
      lungeVec = vec;
      break;
    case "handstandCanvas":
      handstandVec = vec;
      break;
    default:
      break;
  }
}

function calcCosSim(vec, res) {
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    let dotProduct = vidVec[i][0] * vec[i][0] + vidVec[i][1] * vec[i][1];
    let magA = Math.sqrt(
      vidVec[i][0] * vidVec[i][0] + vidVec[i][1] * vidVec[i][1]
    );
    let magB = Math.sqrt(vec[i][0] * vec[i][0] + vec[i][1] * vec[i][1]);

    sum += dotProduct / (magA * magB);
  }
  let num = sum / 12;
  num *= 100;
  //console.log(num.toString());
  res.innerText = num.toFixed(2).toString() + " %";
}

/*
function dotProduct(vecA, vecB) {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

function magnitude(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(vecA, vecB) {
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}
*/
