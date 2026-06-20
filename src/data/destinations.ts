import type { Destination } from "../types";

// Home base.
export const HOME_IDENT = "KEKQ";

/**
 * Default saved destinations. Coordinates resolved during planning (2026-06):
 *  - KEKQ from OurAirports ARP (matches charted DMS).
 *  - Lake House: exact US Census street match.
 *  - Shawn's House: user-provided lat/long.
 *  - Conley Bottom: resolved to Conley Bottom Marina (street # didn't geocode) — verify.
 * All are editable in-app and persisted to localStorage.
 */
export const DEFAULT_DESTINATIONS: Destination[] = [
  { id: "kekq", name: "KEKQ (Home)", ident: "KEKQ", lat: 36.8553, lon: -84.8562 },
  { id: "shawns", name: "Shawn's House", lat: 37.097243, lon: -84.982905 },
  { id: "conley", name: "Conley Bottom", lat: 36.9513, lon: -84.8318, approx: true },
  { id: "lakehouse", name: "Lake House", lat: 36.93588, lon: -85.03724 },
];
