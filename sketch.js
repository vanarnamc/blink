let handsfree; // The handsfree.js tracker
let eyeBlinkHistory = [];
const historyLen = 320;
let runningAvg = 0;
var blinkActivation = 0;
let isDarkMode = false; // Variable to track the mode (light or dark)

let currentHeadlineIndex = 0; // Index of the current headline
let headlines = []; // Array to store fetched headlines

function setup() {
  // Create the headline element
  headlineElement = createDiv('');
  headlineElement.style('position', 'absolute');
  headlineElement.style('top', '50%');
  headlineElement.style('left', '50%');
  headlineElement.style('transform', 'translate(-50%, -50%)'); // Center the div element itself based on its top-left corner
  headlineElement.style('text-align', 'center'); // Horizontally center text

  // Fetch New York Times headlines and store them
  fetchNYTimesHeadlines()
  .then((fetchedHeadlines) => {
    headlines = fetchedHeadlines;
    displayBlinkMessage(); // Change this line
  })
  .catch((error) => {
    console.error('Error fetching headlines:', error);
  });


  // Configure handsfree.js to track hands, body, and/or face.
  handsfree = new Handsfree({
    showDebug: false, /* shows or hides the camera */
    hands: false, /* acquire hand data? */
    pose: false, /* acquire body data? */
    facemesh: true /* acquire face data? */
  });
  handsfree.start();
}

function draw() {
  detectBlinking();
}

function displayBlinkMessage() {
  // Display the current headline
  if (headlines.length === 0) {
    headlineElement.html("<h1>No headlines available</h1>");
    return;
  }

  // Toggle background and text colors
  if (isDarkMode) {
    document.body.style.backgroundColor = "black";
    headlineElement.style('color', 'white'); // Set text color to white using p5.js style() method
  } else {
    document.body.style.backgroundColor = "white";
    headlineElement.style('color', 'black'); // Set text color to black using p5.js style() method
  }
  document.body.style.display = 'flex';
  document.body.style.justifyContent = 'center'; // horizontally center
  document.body.style.alignItems = 'center'; // vertically center
  document.body.style.height = '100vh'; // make sure the body takes the full viewport height

  headlineElement.html(`<h1>${headlines[currentHeadlineIndex]}</h1>`);
  currentHeadlineIndex = (currentHeadlineIndex + 1) % headlines.length; // Loop through headlines

  // Toggle the mode
  isDarkMode = !isDarkMode;
}



// Function to fetch New York Times headlines
async function fetchNYTimesHeadlines() {
  try {
    const response = await fetch('https://api.nytimes.com/svc/topstories/v2/home.json?api-key=n7F1g2jSF17lzYqzPa7W8mqpbyVRKEql');
    const data = await response.json();

    // Get the array of results from the JSON response
    const results = data.results;

    // Extract the headlines from the results
    const headlines = results.map((result) => result.title);

    return headlines;
  } catch (error) {
    throw error;
  }
}

function detectBlinking() {
  if (handsfree.data.facemesh) {
    if (handsfree.data.facemesh.multiFaceLandmarks) {
      var faceLandmarks = handsfree.data.facemesh.multiFaceLandmarks;
      var nFaces = faceLandmarks.length;
      if (nFaces > 0) {
        var whichFace = 0;

        // Measure the openness of the eyes. Your mileage may vary.
        var eyeBlinkMeasurementPairs = [[159, 154], [158, 145], [385, 374], [386, 373]];
        var measurement = 0;
        for (var i = 0; i < eyeBlinkMeasurementPairs.length; i++) {
          var pa = faceLandmarks[whichFace][eyeBlinkMeasurementPairs[i][0]];
          var pb = faceLandmarks[whichFace][eyeBlinkMeasurementPairs[i][1]];
          measurement += dist(pa.x, pa.y, pb.x, pb.y);
        }
        // Add the data to the history;
        for (var i = 0; i < (historyLen - 1); i++) {
          eyeBlinkHistory[i] = eyeBlinkHistory[i + 1];
        }
        eyeBlinkHistory[historyLen - 1] = measurement;

        // Compute stats and Detect a blink!
        runningAvg = 0.95 * runningAvg + 0.05 * measurement;
        var stdv = 0;
        for (var i = 0; i < historyLen; i++) {
          stdv += sq(eyeBlinkHistory[i] - runningAvg);
        }
        stdv = sqrt(stdv / historyLen);

        var blink = false;
        blinkActivation = 0.9 * blinkActivation; // reduce activation
        var threshStdv = 1.0; // how many stdv's to detect a blink
        var threshVal = runningAvg - stdv * threshStdv;
        if ((eyeBlinkHistory[historyLen - 1] < threshVal) &&
          (eyeBlinkHistory[historyLen - 2] >= threshVal)) {
          blink = true;
          blinkActivation = 1.0;
          displayBlinkMessage();

          print("Blink occurred at " + int(millis()) + " milliseconds");
        }
      }
    }
  }
}

// Function to toggle graphics display
function toggleGraphics() {
  showGraphics = !showGraphics;
}
