import { useEffect, useRef, useState } from "react";
import type { Fix, LatLon } from "../types";
import { bearingDeg, destinationPoint, distanceNm } from "../geo/greatCircle";
import type { OwnshipState } from "./useFlightState";

/**
 * Mock flight: flies a direct great-circle from `start` toward `dest` at a fixed
 * ground speed, descending in the final 3 nm so pattern/AGL logic activates. A
 * small lateral wobble exercises the cross-track/correction cue. Loops on arrival.
 * Lets the whole app be developed and demoed without flying. Enable with ?mock=1.
 */
export function useMock(
  active: boolean,
  start: LatLon,
  dest: LatLon,
  speedKt = 110,
): OwnshipState {
  const [state, setState] = useState<OwnshipState>({ fix: null, status: "ok" });
  const posRef = useRef<LatLon>(start);
  const tick = useRef(0);

  // Reset the run whenever destination changes (or start/dest coincide).
  useEffect(() => {
    if (!active) return;
    let s = start;
    if (distanceNm(s, dest) < 2) s = destinationPoint(dest, 200, 12); // ensure a route exists
    posRef.current = s;
    tick.current = 0;
  }, [active, start.lat, start.lon, dest.lat, dest.lon]);

  useEffect(() => {
    if (!active) return;
    const stepNm = speedKt / 3600; // per 1 s
    const timer = setInterval(() => {
      tick.current += 1;
      const pos = posRef.current;
      const dRem = distanceNm(pos, dest);
      if (dRem < 0.15) {
        // arrived → loop from a fresh start for continuous demo
        posRef.current = distanceNm(start, dest) < 2 ? destinationPoint(dest, 200, 12) : start;
        return;
      }
      const brg = bearingDeg(pos, dest);
      const advanced = destinationPoint(pos, brg, Math.min(stepNm, dRem));
      posRef.current = advanced; // advance ON the line (no drift)

      // reported position wobbles laterally for a realistic XTK / turn cue
      const crossNm = 0.12 * Math.sin(tick.current / 4);
      const reported = destinationPoint(advanced, brg + 90, crossNm);
      const altFtMsl = dRem > 3 ? 2200 : 1100 + (dRem / 3) * (2200 - 1100);

      const fix: Fix = {
        lat: reported.lat,
        lon: reported.lon,
        gsKt: speedKt,
        trackDeg: brg,
        altFtMsl,
        accuracyM: 8,
        t: Date.now(),
        trackSource: "gps",
      };
      setState({ fix, status: "ok" });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, dest.lat, dest.lon, start.lat, start.lon, speedKt]);

  return state;
}
