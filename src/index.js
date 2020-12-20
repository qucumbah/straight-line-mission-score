import * as xmlParser from 'fast-xml-parser';
import getScore from './getScore';

const gpxFileInput = document.getElementById('gpxFile');
const startLatInput = document.getElementById('startLat');
const startLonInput = document.getElementById('startLon');
const endLatInput = document.getElementById('endLat');
const endLonInput = document.getElementById('endLon');
const getScoreButton = document.getElementById('getScore');
const warningBlock = document.getElementById('warningBlock');
const scoreBlock = document.getElementById('scoreBlock');

startLatInput.value = localStorage.getItem('startLatInput');
startLonInput.value = localStorage.getItem('startLonInput');
endLatInput.value = localStorage.getItem('endLatInput');
endLonInput.value = localStorage.getItem('endLonInput');
window.onbeforeunload = () => {
  localStorage.setItem('startLatInput', startLatInput.value);
  localStorage.setItem('startLonInput', startLonInput.value);
  localStorage.setItem('endLatInput', endLatInput.value);
  localStorage.setItem('endLonInput', endLonInput.value);
};

const showWarning = () => {
  warningBlock.style.display = 'block';
};
const hideWarning = () => {
  warningBlock.style.display = 'none';
};

gpxFileInput.oninput = () => hideWarning();
startLatInput.oninput = () => hideWarning();
startLonInput.oninput = () => hideWarning();
endLatInput.oninput = () => hideWarning();
endLonInput.oninput = () => hideWarning();

// gpxFileInput.oninput = (event) => {
//   const gpxData = xmlParser.parse(event.target.files[0]);
//   console.log(gpxData);
// };

getScoreButton.onclick = () => {
  if (
    !gpxFileInput.value
    || !startLatInput.value
    || !startLonInput.value
    || !endLatInput.value
    || !endLonInput.value
  ) {
    showWarning();
    // return;
  }

  const reader = new FileReader();
  reader.readAsText(gpxFileInput.files[0]);
  reader.onload = () => {
    const gpxData = xmlParser.parse(reader.result, {
      ignoreAttributes: false,
      arrayMode: true,
    });

    const trackSegments = gpxData.gpx[0].trk[0].trkseg;
    const trackPoints = trackSegments.map((segment) => segment.trkpt).flat();
    const path = trackPoints.map(
      (trackPoint) => [trackPoint['@_lat'], trackPoint['@_lon']]
    );

    const start = [startLatInput.value, startLonInput.value];
    const end = [endLatInput.value, endLonInput.value];

    scoreBlock.innerText = getScore([start, ...path, end]);
  };
};
