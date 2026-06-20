import { useEffect, useRef, useState } from "react";
import type { Fix } from "../types";
import { distanceNm } from "../geo/greatCircle";
import { trackFromPositions } from "../geo/track";
import { metersToFt, mpsToKts } from "../geo/units";
import { saveLastFix } from "./storage";

export type GpsStatus = "searching" | "ok" | "unavailable";

export interface OwnshipState {
  fix: Fix | null;
  status: GpsStatus;
  error?: string;
}

/**
 * Real own-ship state from the paired phone: geolocation watchPosition for
 * position/speed, GPS course-over-ground for track when moving, DeviceOrientation
 * compass as the slow/stationary fallback. Always supplies an error callback.
 * Pass active=false to disable (e.g. when mock mode drives the app).
 */
export function useFlightState(active: boolean): OwnshipState {
  const [state, setState] = useState<OwnshipState>({ fix: null, status: "searching" });
  const last = useRef<Fix | null>(null);
  const compass = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    if (!("geolocation" in navigator)) {
      setState({ fix: null, status: "unavailable", error: "No geolocation API" });
      return;
    }

    const onOrient = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading (iOS) is degrees from true/magnetic north; alpha is 0=N on many.
      const wk = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof wk === "number") compass.current = wk;
      else if (e.alpha != null) compass.current = (360 - e.alpha) % 360;
    };
    window.addEventListener("deviceorientation", onOrient);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        const t = pos.timestamp || Date.now();
        const here = { lat: c.latitude, lon: c.longitude };
        let gsKt = c.speed != null && c.speed >= 0 ? mpsToKts(c.speed) : 0;
        if ((c.speed == null || c.speed < 0) && last.current) {
          const dt = (t - last.current.t) / 1000;
          if (dt > 0) gsKt = (distanceNm(last.current, here) / dt) * 3600;
        }

        let trackDeg: number | null = null;
        let trackSource: Fix["trackSource"] = "none";
        if (c.heading != null && Number.isFinite(c.heading) && gsKt > 4) {
          trackDeg = c.heading;
          trackSource = "gps";
        } else if (last.current && gsKt > 4) {
          const t2 = trackFromPositions(last.current, here);
          if (t2 != null) {
            trackDeg = t2;
            trackSource = "gps";
          }
        }
        if (trackDeg == null && compass.current != null) {
          trackDeg = compass.current;
          trackSource = "compass";
        }

        const fix: Fix = {
          lat: c.latitude,
          lon: c.longitude,
          gsKt,
          trackDeg,
          altFtMsl: c.altitude != null ? metersToFt(c.altitude) : null,
          accuracyM: c.accuracy ?? null,
          t,
          trackSource,
        };
        last.current = fix;
        saveLastFix(fix);
        setState({ fix, status: "ok" });
      },
      (err) => setState({ fix: last.current, status: "unavailable", error: err.message }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
    );

    return () => {
      navigator.geolocation.clearWatch(id);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [active]);

  return state;
}
