import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from "d3-geo";
import { rotation } from "./state.js";

// Singleton projection whose state is derived from the `rotation` signal.
// Components call `syncProjection(width, height)` each render so sizes stay fresh.
const projection = geoOrthographic().clipAngle(90).precision(0.5);
const path = geoPath(projection);

// Fraction of the half-viewport reserved as padding so arc tails have room
// to extend past the globe silhouette without being clipped.
const GLOBE_PADDING = 0.14;

export function syncProjection(width, height) {
  const size = Math.min(width, height);
  projection.translate([width / 2, height / 2]);
  projection.scale(size / 2 * (1 - GLOBE_PADDING));
  projection.rotate(rotation.value);
  return { projection, path };
}

export { projection, path, geoGraticule10, geoDistance };

// Project a [lon, lat] point; returns null if on the far side of the globe.
export function projectPoint([lon, lat]) {
  const centre = projection.invert(projection.translate());
  const d = geoDistance([lon, lat], centre);
  if (d > Math.PI / 2 - 0.02) return null;
  return projection([lon, lat]);
}

// ---------- 3D helpers for elevated arc trajectories ----------

const DEG = Math.PI / 180;

function lonLatToVec(lon, lat) {
  const lam = lon * DEG;
  const phi = lat * DEG;
  const c = Math.cos(phi);
  return [c * Math.cos(lam), c * Math.sin(lam), Math.sin(phi)];
}

// Apply d3-geo's rotation [lambda, phi, gamma] (degrees) to a unit 3D point.
// Sequence: Z by +λ, Y by +φ, X by +γ. Derived from d3-geo source.
function rotate3(v, rot) {
  const L = rot[0] * DEG;
  const P = rot[1] * DEG;
  const G = rot[2] * DEG;
  let [x, y, z] = v;
  const cL = Math.cos(L), sL = Math.sin(L);
  let nx = x * cL - y * sL;
  let ny = x * sL + y * cL;
  let nz = z;
  x = nx; y = ny; z = nz;
  const cP = Math.cos(P), sP = Math.sin(P);
  nx = x * cP - z * sP;
  ny = y;
  nz = z * cP + x * sP;
  x = nx; y = ny; z = nz;
  const cG = Math.cos(G), sG = Math.sin(G);
  nx = x;
  ny = y * cG - z * sG;
  nz = z * cG + y * sG;
  return [nx, ny, nz];
}

// Project a point at (lon, lat) at altitude `alt` (1.0 = surface) to screen.
// Returns { sx, sy, depth, occluded }:
//   depth  > 0 => front hemisphere
//   occluded = the globe body hides the point (behind AND inside silhouette)
export function projectElevated([lon, lat], alt = 1) {
  const [cx, cy] = projection.translate();
  const scale = projection.scale();
  const rot = projection.rotate();
  const [x, y, z] = rotate3(lonLatToVec(lon, lat), rot);
  const sx = cx + scale * alt * y;
  const sy = cy - scale * alt * z;
  const radial = alt * Math.sqrt(y * y + z * z);
  const occluded = x < 0 && radial < 1;
  return { sx, sy, depth: x, occluded, radial };
}

// Walk a great-circle arc from [lon, lat] along `bearing` (radians clockwise
// from north) for an angular distance of `angle` (radians). Returns [lon, lat]
// in degrees. Standard aviation formula.
export function destination([lon, lat], bearing, angle) {
  const phi1 = lat * DEG;
  const lam1 = lon * DEG;
  const sinPhi1 = Math.sin(phi1), cosPhi1 = Math.cos(phi1);
  const sinA = Math.sin(angle),   cosA = Math.cos(angle);
  const phi2 = Math.asin(sinPhi1 * cosA + cosPhi1 * sinA * Math.cos(bearing));
  const lam2 = lam1 + Math.atan2(
    Math.sin(bearing) * sinA * cosPhi1,
    cosA - sinPhi1 * Math.sin(phi2)
  );
  return [((lam2 / DEG) + 540) % 360 - 180, phi2 / DEG];
}
