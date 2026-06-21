import { useEffect, useRef, useState } from "react";
import type { LatLon, Wind } from "../types";
import { distanceNm } from "../geo/greatCircle";
import { parseMetar, type MetarJson } from "../wind/metar";

// Region bounding box (minLat,minLon,maxLat,maxLon): fetch ALL reporting stations
// near the operating area so we can always pick the nearest one to any point.
const REGION_BBOX = "35.5,-86.5,38.5,-83";
const REFRESH_MS = 5 * 60 * 1000;
const CACHE_KEY = "rotortrack:metar";

// Dev: through the Vite proxy to AWC. Prod: the same-origin Vercel function.
const metarUrl = () =>
  import.meta.env.DEV
    ? `/awc/api/data/metar?bbox=${REGION_BBOX}&format=json`
    : `/api/metar?bbox=${encodeURIComponent(REGION_BBOX)}`;

interface StationWind extends Wind {
  lat: number;
  lon: number;
}

function loadCache(): StationWind[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

export interface WindState {
  /** all station winds (freshest cached), for nearest-station selection */
  stations: StationWind[];
  /** wind nearest a given point (e.g. own-ship or a destination airport) */
  near: (p: LatLon) => Wind | null;
  updatedMs: number | null;
}

export function useWind(mock: boolean): WindState {
  const [stations, setStations] = useState<StationWind[]>(loadCache);
  const [updatedMs, setUpdatedMs] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchWx() {
      try {
        const res = await fetch(metarUrl(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: MetarJson[] = await res.json();
        const sw: StationWind[] = data
          .filter((m) => m.lat != null && m.lon != null)
          .map((m) => ({ ...parseMetar(m), lat: m.lat!, lon: m.lon! }));
        if (cancelled || sw.length === 0) return;
        setStations(sw);
        setUpdatedMs(Date.now());
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(sw));
        } catch {
          /* ignore */
        }
      } catch {
        // keep last cached wind; if mock and nothing cached, synthesize a demo wind
        if (mock && !cancelled) {
          setStations((prev) =>
            prev.length
              ? prev
              : [
                  {
                    dirDegTrue: 240,
                    speedKt: 9,
                    gustKt: 15,
                    variable: false,
                    station: "KEKQ",
                    observedMs: Date.now(),
                    raw: "MOCK 24009G15KT",
                    lat: 36.8553,
                    lon: -84.8562,
                  },
                ],
          );
          setUpdatedMs(Date.now());
        }
      }
    }
    fetchWx();
    timer.current = setInterval(fetchWx, REFRESH_MS);
    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [mock]);

  const near = (p: LatLon): Wind | null => {
    if (!stations.length) return null;
    let best = stations[0];
    let bestD = distanceNm(p, best);
    for (const s of stations.slice(1)) {
      const d = distanceNm(p, s);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  };

  return { stations, near, updatedMs };
}
