import type { LatLon, RunwayEnd } from "../types";
import { angleDelta, toRad } from "../geo/units";

export type Leg =
  | "UPWIND"
  | "CROSSWIND"
  | "DOWNWIND"
  | "BASE"
  | "FINAL"
  | "MANEUVERING";

export interface PatternResult {
  leg: Leg;
  nextLeg: Leg | null;
  /** runway-relative along-track (nm, + past threshold in landing dir) and cross (nm, + right). */
  alongNm: number;
  crossNm: number;
  /** track relative to runway heading, deg (-180,180]. */
  trackRel: number;
  leftTraffic: boolean;
}

const NEXT: Record<Leg, Leg | null> = {
  UPWIND: "CROSSWIND",
  CROSSWIND: "DOWNWIND",
  DOWNWIND: "BASE",
  BASE: "FINAL",
  FINAL: null,
  MANEUVERING: null,
};

/** Local east/north offset (nm) of pos from a reference threshold. */
export function localEnuNm(ref: LatLon, pos: LatLon): { east: number; north: number } {
  const north = (pos.lat - ref.lat) * 60;
  const east = (pos.lon - ref.lon) * 60 * Math.cos(toRad(ref.lat));
  return { east, north };
}

/** Project an east/north offset into runway-relative (along landing dir, cross=+right). */
export function runwayFrame(
  east: number,
  north: number,
  headingT: number,
): { alongNm: number; crossNm: number } {
  const h = toRad(headingT);
  return {
    alongNm: east * Math.sin(h) + north * Math.cos(h),
    crossNm: east * Math.cos(h) - north * Math.sin(h),
  };
}

export interface ClassifyInput {
  alongNm: number;
  crossNm: number;
  trackRel: number; // angleDelta(runwayHeading, track)
  leftTraffic: boolean;
}

/** Pure leg classifier from runway-relative geometry. */
export function classifyLeg(i: ClassifyInput): Leg {
  const patternSide = i.leftTraffic ? -i.crossNm : i.crossNm; // + = on the pattern side
  const a = Math.abs(i.trackRel);
  const aligned = a < 45;
  const reversed = a > 135;
  const perpendicular = Math.abs(a - 90) < 45;
  const onSide = patternSide > 0.25;

  if (aligned && i.alongNm <= 0.2) return "FINAL";
  if (aligned && i.alongNm > 0.2) return "UPWIND";
  if (reversed && onSide) return "DOWNWIND";
  if (perpendicular && onSide) return i.alongNm <= 0.3 ? "BASE" : "CROSSWIND";
  return "MANEUVERING";
}

/**
 * Detect the traffic-pattern leg for the recommended landing runway end.
 * Uses the approach-end threshold (le/he lat/lon) and the end's true heading.
 * Defaults to LEFT traffic unless `end.rightTraffic` is set.
 */
export function detectPattern(
  pos: LatLon,
  trackDeg: number,
  end: RunwayEnd,
): PatternResult | null {
  if (end.headingT == null || end.lat == null || end.lon == null) return null;
  const { east, north } = localEnuNm({ lat: end.lat, lon: end.lon }, pos);
  const { alongNm, crossNm } = runwayFrame(east, north, end.headingT);
  const trackRel = angleDelta(end.headingT, trackDeg);
  const leftTraffic = !end.rightTraffic;
  const leg = classifyLeg({ alongNm, crossNm, trackRel, leftTraffic });
  return { leg, nextLeg: NEXT[leg], alongNm, crossNm, trackRel, leftTraffic };
}

/** Standard pattern altitude (MSL): field elevation + TPA AGL (default 1000'). */
export function patternAltitudeFt(fieldElevFt: number | null, tpaAgl = 1000): number | null {
  return fieldElevFt == null ? null : fieldElevFt + tpaAgl;
}

/** Rough AGL estimate from GPS MSL altitude and field elevation. Advisory only. */
export function aglEstimateFt(gpsAltFtMsl: number | null, fieldElevFt: number | null): number | null {
  if (gpsAltFtMsl == null || fieldElevFt == null) return null;
  return Math.round(gpsAltFtMsl - fieldElevFt);
}
