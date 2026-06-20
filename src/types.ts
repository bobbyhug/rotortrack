// Shared domain types for RotorTrack.

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Destination extends LatLon {
  id: string;
  name: string;
  /** Optional ICAO/local ident if this destination is an airport. */
  ident?: string;
  /** True if user-editable / not from a trusted geocode (show "verify"). */
  approx?: boolean;
}

export interface RunwayEnd {
  ident: string; // e.g. "05"
  headingT: number | null; // true heading of this end, degrees
  lat: number | null;
  lon: number | null;
  rightTraffic?: boolean; // pattern direction for this end (default left)
}

export interface Runway {
  lengthFt: number | null;
  surface: string; // ASPH, TURF, CONC, ...
  hard: boolean; // hard surface?
  le: RunwayEnd;
  he: RunwayEnd;
}

export interface Airport extends LatLon {
  ident: string; // OurAirports ident (often ICAO)
  name: string;
  type: string; // heliport | small_airport | medium_airport | large_airport
  elevationFt: number | null;
  runways: Runway[];
}

export interface Wind {
  dirDegTrue: number | null; // null = variable/calm direction
  speedKt: number;
  gustKt: number | null;
  variable: boolean;
  station: string;
  observedMs: number; // epoch ms of observation
  raw: string;
}

/** Live own-ship state, normalized from geolocation/compass/mock. */
export interface Fix extends LatLon {
  /** ground speed, knots */
  gsKt: number;
  /** ground track / course-over-ground, degrees true (best estimate) */
  trackDeg: number | null;
  /** GPS altitude MSL in feet (often poor/absent) */
  altFtMsl: number | null;
  /** horizontal accuracy, meters */
  accuracyM: number | null;
  /** epoch ms */
  t: number;
  /** how track was derived */
  trackSource: "gps" | "compass" | "none";
}
