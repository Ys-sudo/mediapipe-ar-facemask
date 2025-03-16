import vision from "./task-vision.js"
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
const demosSection = document.getElementById("demos");
const imageBlendShapes = document.getElementById("image-blend-shapes");
const videoBlendShapes = document.getElementById("video-blend-shapes");

let faceLandmarker;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = 480;

async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://cdn.glitch.global/76e612b1-2cef-4fcd-994b-0a7cbdf34bca/face_landmarker.task?v=1742134271597`,
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1,
  });
  demosSection.classList.remove("invisible");
}
createFaceLandmarker();

const imageContainers = document.getElementsByClassName("detectOnClick");

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");

const canvasCtx = canvasElement.getContext("2d");

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  const constraints = {
    video: true,
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
const drawingUtils = new DrawingUtils(canvasCtx);
async function predictWebcam() {
  const radio = video.videoHeight / video.videoWidth;
  video.style.width = videoWidth + "px";
  video.style.height = videoWidth * radio + "px";
  canvasElement.style.width = videoWidth + "px";
  canvasElement.style.height = videoWidth * radio + "px";
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await faceLandmarker.setOptions({ runningMode: runningMode });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, startTimeMs);
  }
  console.log(results);
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
       drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#000000", lineWidth: 2 }
      );
      /*drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 0.5 }
      );
      */
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030",lineWidth: 0 }
      );
      
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      );
      
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      );
      /*
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { fillColor: "#00000000", lineWidth: 0 }
      );*/
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#000000" }
      );
      
      // Display all landmark numbers - for mapping
      displayLandmarkNumbers(landmarks);
      
      
      drawShape(landmarks, [117, 50, 205, 36,100,120,230,229,117]);
      drawShape(landmarks, [346, 280, 425, 266, 329, 349, 450, 449,346]);
      
      drawShape(landmarks, [55,107,66,105,63,46,53,52,65,55]);
      drawShape(landmarks, [285,336,296,334,293,276,283,282,295,285]);
      
      
      fillLipsWithColor(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS);
      
    }
  }
  drawBlendShapes(videoBlendShapes, results.faceBlendshapes);

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
  

}


function displayLandmarkNumbers(landmarks) {
  // Set font and style for the text
  canvasCtx.font = "5px Arial";
  canvasCtx.fillStyle = "blue"; // Blue text for clarity

  landmarks.forEach((point, index) => {
    const x = point.x * canvasElement.width;
    const y = point.y * canvasElement.height;
    
    // Display the landmark number at its position
    canvasCtx.fillText(index, x, y);
  });
}





function drawShape(landmarks, indices) {
  // Start the path for drawing
  canvasCtx.beginPath();
  
  // Move to the first point
  let firstPoint = landmarks[indices[0]];
  canvasCtx.moveTo(firstPoint.x * canvasElement.width, firstPoint.y * canvasElement.height);
  
  // Loop through the rest of the indices and draw lines between points
  indices.forEach(index => {
    const point = landmarks[index];
    const x = point.x * canvasElement.width;
    const y = point.y * canvasElement.height;
    canvasCtx.lineTo(x, y);
  });

  // Close the shape and fill it
  canvasCtx.closePath();
  canvasCtx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Example: semi-transparent red fill
  canvasCtx.fill();

  // Optional: Stroke the shape
  canvasCtx.strokeStyle = "rgba(0, 0, 0, .1)";
  canvasCtx.stroke();
}

// Example usage: draw shape using landmarks 20 to 30










function fillLipsWithColor(landmarks, lipIndices) {
  // Function to draw and fill lips
  const drawLip = (startIdx, endIdx, reverse = false) => {
    const points = lipIndices.slice(startIdx, endIdx).flatMap(index => [
      landmarks[index.start],
      landmarks[index.end]
    ]);
    if (reverse) points.reverse();
    points.forEach(point => {
      const x = point.x * canvasElement.width;
      const y = point.y * canvasElement.height;
      canvasCtx.lineTo(x, y);
    });
  };

  // Draw lower lip (0-10 and 20-30)
  canvasCtx.beginPath();
  drawLip(0, 10);  // Lower lip bottom
  drawLip(20, 30, true);  // Lower lip top
  canvasCtx.closePath();
  canvasCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
  canvasCtx.fill();

  // Draw upper lip (10-20 and 30-40)
  canvasCtx.beginPath();
  drawLip(10, 20);  // Upper lip top
  drawLip(30, 40, true);  // Upper lip bottom
  canvasCtx.closePath();
  canvasCtx.fillStyle = "rgba(0, 0, 0, .75)";
  canvasCtx.fill();
}




function drawBlendShapes(el, blendShapes) {
  if (!blendShapes.length) {
    return;
  }

  console.log(blendShapes[0]);

  let htmlMaker = "";
  blendShapes[0].categories.map((shape) => {
    htmlMaker += `
      <li class="blend-shapes-item">
        <span class="blend-shapes-label">${
          shape.displayName || shape.categoryName
        }</span>
        <span class="blend-shapes-value" style="width: calc(${
          +shape.score * 100
        }% - 120px)">${(+shape.score).toFixed(4)}</span>
      </li>
    `;
  });

  el.innerHTML = htmlMaker;
}
