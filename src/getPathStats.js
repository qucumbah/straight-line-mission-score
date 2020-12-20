import * as GeoLib from 'geographiclib';

const Geodesic = GeoLib.Geodesic.WGS84;

const getPathStats = (path) => {
  const start = path[0];
  const end = path[path.length - 1];

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

  // It really would've been so much easier if the earth was flat
  return path.reduce((pathStats, curPoint, curPointIndex) => {
    if (curPoint === start) {
      return pathStats;
    }

    const prevPoint = path[curPointIndex - 1];

    const distanceFromStartToCurPoint = Geodesic.Inverse(...start, ...curPoint).s12;

    // This is not the closest point, but rough estimation should be good enough since we only need
    // the direction and in most places on earth curvature isn't large enough to cause any
    // significant distortions with such small errors
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

    const getNewArea = () => {
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
        return firstTriangleArea + secondTriangleArea;
      }

      const trapezoidFirstBaseLength = distance(prevPointProjection, prevPoint);
      const trapezoidSecondBaseLength = distance(curPointProjection, curPoint);
      const trapezoidHeight = distance(prevPointProjection, curPointProjection);
      const trapezoidArea = (
        0.5 * (trapezoidFirstBaseLength + trapezoidSecondBaseLength) * trapezoidHeight
      );

      return trapezoidArea;
    };

    const isGoingForward = dotProduct(pointsDifferenceNormal, straightLineDirectionVector) > 0;
    const areaMultiplier = isGoingForward ? 1 : -1;

    return {
      ...pathStats,
      areaSum: pathStats.areaSum + areaMultiplier * getNewArea(),
      totalPathLength: pathStats.totalPathLength + distance(prevPoint, curPoint),
    };
  }, {
    straightLineLength: straightLine.s13,
    areaSum: 0,
    totalPathLength: 0,
  });
};
export default getPathStats;
