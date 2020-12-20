import * as xmlParser from 'fast-xml-parser';
import getPathStats from './getPathStats';

const gpxFileInput = document.getElementById('gpxFile');
const startLatInput = document.getElementById('startLat');
const startLonInput = document.getElementById('startLon');
const endLatInput = document.getElementById('endLat');
const endLonInput = document.getElementById('endLon');
const getScoreButton = document.getElementById('getScore');
const infoBlock = document.getElementById('infoBlock');
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

const showWarning = (warning) => {
  infoBlock.innerText = warning;
  infoBlock.style.display = 'block';
};
const hideInfoBlock = () => {
  infoBlock.style.display = 'none';
};

window.onerror = (error) => {
  infoBlock.innerText = (
    `An error has occured. Ensure the gpx file and start/end locations are right.
    If the error is still present, send this message and your .gpx file to the author:
    ${error}`
  );
  infoBlock.style.display = 'block';
};

gpxFileInput.oninput = () => hideInfoBlock();
startLatInput.oninput = () => hideInfoBlock();
startLonInput.oninput = () => hideInfoBlock();
endLatInput.oninput = () => hideInfoBlock();
endLonInput.oninput = () => hideInfoBlock();

getScoreButton.onclick = () => {
  if (
    !gpxFileInput.value
    || !startLatInput.value
    || !startLonInput.value
    || !endLatInput.value
    || !endLonInput.value
  ) {
    showWarning('Not all inputs have been filled');
    return;
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
      (trackPoint) => [Number(trackPoint['@_lat']), Number(trackPoint['@_lon'])]
    );

    const start = [Number(startLatInput.value), Number(startLonInput.value)];
    const end = [Number(endLatInput.value), Number(endLonInput.value)];

    const {
      straightLineLength,
      totalPathLength,
      areaSum,
    } = getPathStats([start, ...path, end]);

    const niceify = (number) => number.toFixed(2);

    scoreBlock.innerText = `
    Straight line length: ${niceify(straightLineLength)}m
    Your path length: ${niceify(totalPathLength)}m
    Area sum: ${niceify(areaSum)}m^2
    Average deviation (area sum / straight line length): ${niceify(areaSum / straightLineLength)}m

    If this doesn't look right to you please send me your .gpx file and straight line start/end
    `;
  };
};
