import type { Wind } from "../types";

/** Raw shape of one entry from aviationweather.gov /api/data/metar?format=json. */
export interface MetarJson {
  icaoId?: string;
  wdir?: number | string | null; // degrees true, or "VRB"
  wspd?: number | null; // knots
  wgst?: number | null; // knots
  obsTime?: number; // epoch seconds
  rawOb?: string;
  name?: string;
  lat?: number;
  lon?: number;
}

/**
 * Normalize one AWC METAR JSON entry into our Wind model.
 * Calm (00000KT) → speed 0, dir null, variable false.
 * Variable (VRB) → variable true, dir null.
 */
export function parseMetar(m: MetarJson): Wind {
  const raw = m.rawOb ?? "";
  const speedKt = typeof m.wspd === "number" ? m.wspd : 0;
  const vrb = m.wdir === "VRB" || /\bVRB\d{2}/.test(raw);
  const calm = speedKt === 0;
  let dir: number | null = null;
  if (!vrb && typeof m.wdir === "number" && !calm) dir = m.wdir;
  return {
    dirDegTrue: dir,
    speedKt,
    gustKt: typeof m.wgst === "number" ? m.wgst : null,
    variable: vrb,
    station: m.icaoId ?? "",
    observedMs: m.obsTime ? m.obsTime * 1000 : Date.now(),
    raw,
  };
}

/** Pick the freshest, non-empty METAR from a list (already station-filtered). */
export function pickFreshest(list: MetarJson[]): Wind | null {
  const winds = list.map(parseMetar).sort((a, b) => b.observedMs - a.observedMs);
  return winds[0] ?? null;
}

const HOUR = 3600_000;
/** METAR older than this is "stale" and should be labeled as such. */
export function isStale(w: Wind | null, maxAgeMs = 2 * HOUR, now = Date.now()): boolean {
  return !w || now - w.observedMs > maxAgeMs;
}

/** Format wind for a compact HUD readout, e.g. "240@8G15" or "CALM" / "VRB". */
export function formatWind(w: Wind | null): string {
  if (!w) return "wind n/a";
  if (w.speedKt === 0) return "CALM";
  if (w.variable || w.dirDegTrue == null) return `VRB@${Math.round(w.speedKt)}`;
  const g = w.gustKt ? `G${Math.round(w.gustKt)}` : "";
  return `${String(Math.round(w.dirDegTrue)).padStart(3, "0")}@${Math.round(w.speedKt)}${g}`;
}
