import * as GeoLib from 'geographiclib';

const Geodesic = GeoLib.Geodesic.WGS84;

// const start = [56.96312268404305, 41.01163666850142];
// const end = [56.963852651453784, 41.01160976533879];
// const path = [
//   start,
//   [56.96331786896347, 41.011696683846345],
//   [56.963645057504785, 41.01151870680968],
//   end,
// ];
const start = [66.13259527092102, 14.51620449537943];
const end = [66.2839110204309, 14.04505829036475];
const path = [
  start,
  [66.13479457844826, 14.511480555153858],
  [66.13542668840792, 14.50855776495391],
  [66.1361378513139, 14.504205362272268],
  [66.14188627044503, 14.489258243307901],
  [66.14798312766737, 14.473191455856737],
  [66.15853559215151, 14.434159582950029],
  [66.18696821722067, 14.345811550726077],
  [66.24177758072159, 14.17877239233793],
  [66.28118463880449, 14.05197444672095],
  end,
];

const straightLine = Geodesic.InverseLine(...start, ...end);
const straightLinePoint = (meters) => {
  const pointOnLine = Geodesic.Direct(
    straightLine.lat1,
    straightLine.lon1,
    straightLine.azi1,
    meters,
  );

  return [pointOnLine.lat2, pointOnLine.lon2];
};

const distance = (pointA, pointB) => Geodesic.Inverse(...pointA, ...pointB).s12;

const getAngleFromAzimuth = (azimuth) => azimuth / 180 * Math.PI + Math.PI / 2;
const getNormalFromAngle = (angle) => [Math.cos(angle), Math.sin(angle)];

const length = ([x, y]) => Math.sqrt(x * x + y * y);
const normalize = (vector) => [vector[0] / length(vector), vector[1] / length(vector)];

const add = ([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2];
const subtract = ([x1, y1], [x2, y2]) => [x1 - x2, y1 - y2];
const multiply = ([x, y], scalar) => [x * scalar, y * scalar];
const dotProduct = ([x1, y1], [x2, y2]) => x1 * x2 + y1 * y2;
const crossProduct = ([x1, y1], [x2, y2]) => x1 * y2 - y1 * x2;

const getPerpendicular = ([x, y]) => [y, -x];

// https://stackoverflow.com/a/565282/9967543
function intersectLines(p, r, q, s) {
  const rCrossS = crossProduct(r, s);
  const qMinusPCrossS = crossProduct(subtract(q, p), s);
  const qMinusPCrossR = crossProduct(subtract(q, p), r);

  if (rCrossS === 0 && qMinusPCrossR === 0) {
    // Lines are collinear
    // TODO: check if lines overlap
    return null;
  }

  if (rCrossS === 0 && qMinusPCrossR !== 0) {
    // Lines are parallel
    return null;
  }

  const t = qMinusPCrossS / rCrossS;
  return add(p, multiply(r, t));
}

function intersectVectorAndLine(p, r, q, s) {
  const rCrossS = crossProduct(r, s);
  const qMinusPCrossS = crossProduct(subtract(q, p), s);
  const qMinusPCrossR = crossProduct(subtract(q, p), r);

  if (rCrossS === 0 && qMinusPCrossR === 0) {
    // Lines are collinear
    // TODO: check if lines overlap
    return null;
  }

  if (rCrossS === 0 && qMinusPCrossR !== 0) {
    // Lines are parallel
    return null;
  }

  const t = qMinusPCrossS / rCrossS;
  return (t >= 0 && t <= 1) ? add(p, multiply(r, t)) : null;
}

const lineFromPoints = ([x1, y1], [x2, y2]) => [[x1, y1], [x2 - x1, y2 - y1]];

// It really would've been so much easier if the earth was flat
const result = path.reduce((areaSum, curPoint, curPointIndex) => {
  if (curPoint === start) {
    return 0;
  }

  const prevPoint = path[curPointIndex - 1];

  const distanceFromStartToCurPoint = Geodesic.Inverse(...start, ...curPoint).s12;

  // This is not the closest point, but rough estimation should be good enough since we only need
  // the direction and in most places on earth curvature isn't large enough to cause any significant
  // distortions with such small errors
  const closePointOnStraightLine = straightLinePoint(distanceFromStartToCurPoint);
  const guidePointOnStraightLine = straightLinePoint(distanceFromStartToCurPoint + 5);

  // console.log(closePointOnStraightLine, guidePointOnStraightLine);
  const straightLineDirectionVector = subtract(
    guidePointOnStraightLine,
    closePointOnStraightLine
  );

  const pointsDifferenceNormal = subtract(curPoint, prevPoint);

  const pathIntersectionWithStraightLine = intersectVectorAndLine(
    prevPoint,
    pointsDifferenceNormal,
    closePointOnStraightLine,
    straightLineDirectionVector,
  );

  const prevPointProjection = intersectLines(
    closePointOnStraightLine,
    straightLineDirectionVector,
    prevPoint,
    getPerpendicular(straightLineDirectionVector),
  );

  const curPointProjection = intersectLines(
    closePointOnStraightLine,
    straightLineDirectionVector,
    curPoint,
    getPerpendicular(straightLineDirectionVector),
  );

  if (pathIntersectionWithStraightLine !== null) {
    const firstTriangleArea = (
      0.5
      * distance(prevPointProjection, prevPoint)
      * distance(prevPointProjection, pathIntersectionWithStraightLine)
    );
    const secondTriangleArea = (
      0.5
      * distance(curPointProjection, curPoint)
      * distance(curPointProjection, pathIntersectionWithStraightLine)
    );
    console.log('inters', firstTriangleArea + secondTriangleArea);
    return areaSum + firstTriangleArea + secondTriangleArea;
  }

  const trapezoidFirstBaseLength = distance(prevPointProjection, prevPoint);
  const trapezoidSecondBaseLength = distance(curPointProjection, curPoint);
  const trapezoidHeight = distance(prevPointProjection, curPointProjection);

  return areaSum + 0.5 * (trapezoidFirstBaseLength + trapezoidSecondBaseLength) * trapezoidHeight;
}, 0);

console.log(result);
