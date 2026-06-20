import type { Destination, LatLon } from "../types";
import { DEFAULT_DESTINATIONS } from "../data/destinations";

const K = {
  dests: "rotortrack:destinations",
  lastFix: "rotortrack:lastfix",
  disclaimer: "rotortrack:disclaimerAck",
  settings: "rotortrack:settings",
};

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, val: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

export const loadDestinations = (): Destination[] =>
  load(K.dests, DEFAULT_DESTINATIONS);
export const saveDestinations = (d: Destination[]): void => save(K.dests, d);

export const loadLastFix = (): LatLon | null => load(K.lastFix, null);
export const saveLastFix = (p: LatLon): void => save(K.lastFix, { lat: p.lat, lon: p.lon });

export const disclaimerAck = (): boolean => load(K.disclaimer, false);
export const ackDisclaimer = (): void => save(K.disclaimer, true);

export interface Settings {
  trackUp: boolean;
  tpaAgl: number; // pattern altitude AGL
  glideRatio: number; // R44 advisory glide/auto figure
  callsign: string; // spoken callsign for CTAF self-announce calls
}
export const DEFAULT_SETTINGS: Settings = {
  trackUp: true,
  tpaAgl: 1000,
  glideRatio: 4,
  callsign: "Helicopter 63 Mike Papa",
};
export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...load(K.settings, {}) });
export const saveSettings = (s: Settings): void => save(K.settings, s);
