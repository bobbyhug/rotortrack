import type { Runway, RunwayEnd, Wind } from "../types";
import { angleDelta, toRad } from "../geo/units";

export interface WindComponents {
  headwindKt: number; // positive = headwind, negative = tailwind
  crosswindKt: number; // magnitude
  crosswindSide: "L" | "R"; // side the wind is coming FROM relative to runway heading
  tailwind: boolean;
}

/**
 * Wind components for landing on a runway whose heading is `runwayHeadingT`
 * (deg true), given wind FROM `windDirT` at `windKt`.
 */
export function windComponents(
  runwayHeadingT: number,
  windDirT: number,
  windKt: number,
): WindComponents {
  const rel = angleDelta(runwayHeadingT, windDirT); // (-180,180], + = wind from the right
  const headwindKt = Math.cos(toRad(rel)) * windKt;
  const crosswindKt = Math.abs(Math.sin(toRad(rel)) * windKt);
  return {
    headwindKt,
    crosswindKt,
    crosswindSide: rel >= 0 ? "R" : "L",
    tailwind: headwindKt < 0,
  };
}

export interface RunwayRecommendation {
  end: RunwayEnd;
  runway: Runway;
  components: WindComponents;
}

/**
 * Pick the runway END that gives the best (largest) headwind for the given wind.
 * Returns null when wind is calm/variable/unavailable or no runway has a heading.
 */
export function bestRunway(
  runways: Runway[],
  wind: Wind | null,
): RunwayRecommendation | null {
  if (!wind || wind.variable || wind.dirDegTrue == null || wind.speedKt < 1) {
    return null;
  }
  let best: RunwayRecommendation | null = null;
  for (const rw of runways) {
    for (const end of [rw.le, rw.he]) {
      if (end.headingT == null) continue;
      const components = windComponents(end.headingT, wind.dirDegTrue, wind.speedKt);
      if (!best || components.headwindKt > best.components.headwindKt) {
        best = { end, runway: rw, components };
      }
    }
  }
  return best;
}
