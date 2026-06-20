import type { LatLon } from "../types";
import { EARTH_R_NM, norm360, toDeg, toRad } from "./units";

/** Great-circle distance in nautical miles (haversine). */
export function distanceNm(a: LatLon, b: LatLon): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial great-circle bearing a→b, degrees true [0, 360). */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return norm360(toDeg(Math.atan2(y, x)));
}

export interface CrossTrack {
  /** Signed cross-track distance, nm. Negative = left of course, positive = right. */
  xtkNm: number;
  side: "L" | "R";
  /** Along-track distance from A toward B at the foot of the perpendicular, nm. */
  alongNm: number;
}

/**
 * Cross-track error of point p relative to the great-circle leg a→b.
 * Sign convention verified by test: a point to the LEFT of the course is negative.
 */
export function crossTrack(p: LatLon, a: LatLon, b: LatLon): CrossTrack {
  const d13 = distanceNm(a, p) / EARTH_R_NM; // angular distance A→P
  const th13 = toRad(bearingDeg(a, p));
  const th12 = toRad(bearingDeg(a, b));
  const dxtAng = Math.asin(Math.sin(d13) * Math.sin(th13 - th12));
  const xtkNm = dxtAng * EARTH_R_NM;
  const alongAng = Math.acos(
    Math.max(-1, Math.min(1, Math.cos(d13) / Math.cos(dxtAng))),
  );
  return {
    xtkNm,
    side: xtkNm < 0 ? "L" : "R",
    alongNm: alongAng * EARTH_R_NM,
  };
}

/** Destination point given start, bearing (deg true), distance (nm). */
export function destinationPoint(
  a: LatLon,
  bearing: number,
  distNm: number,
): LatLon {
  const d = distNm / EARTH_R_NM;
  const th = toRad(bearing);
  const lat1 = toRad(a.lat);
  const lon1 = toRad(a.lon);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(th),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(th) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: toDeg(lat2), lon: ((toDeg(lon2) + 540) % 360) - 180 };
}

/** Estimated time enroute, in seconds, given distance (nm) and ground speed (kt). */
export function eteSeconds(distNm: number, gsKt: number): number | null {
  if (gsKt <= 0.5) return null;
  return (distNm / gsKt) * 3600;
}
