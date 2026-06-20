import type { LatLon } from "../types";
import { bearingDeg, distanceNm } from "./greatCircle";
import { angleDelta, metersToNm } from "./units";

/**
 * Ground track (course over ground) from two successive fixes, degrees true.
 * Returns null if the points are too close to be meaningful (noise).
 */
export function trackFromPositions(
  prev: LatLon,
  cur: LatLon,
  minMeters = 8,
): number | null {
  if (distanceNm(prev, cur) < metersToNm(minMeters)) return null;
  return bearingDeg(prev, cur);
}

export interface TurnCue {
  /** degrees to turn to point at the target; magnitude only */
  deg: number;
  side: "L" | "R";
}

/**
 * Correction cue: how to turn from current track to fly directly at the target
 * bearing. e.g. { deg: 6, side: "R" } => "turn 6° R".
 */
export function turnCue(currentTrackDeg: number, targetBearingDeg: number): TurnCue {
  const d = angleDelta(currentTrackDeg, targetBearingDeg);
  return { deg: Math.abs(Math.round(d)), side: d >= 0 ? "R" : "L" };
}
