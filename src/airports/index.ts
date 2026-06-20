import type { Airport, LatLon, Runway, Wind } from "../types";
import { bearingDeg, distanceNm } from "../geo/greatCircle";
import { bestRunway, type RunwayRecommendation } from "../wind/components";
import airportsData from "../data/airports.json";

export const AIRPORTS = airportsData as Airport[];
const BY_IDENT = new Map(AIRPORTS.map((a) => [a.ident, a]));

export function airportByIdent(ident: string): Airport | undefined {
  return BY_IDENT.get(ident);
}

export interface NearbyAirport {
  airport: Airport;
  distanceNm: number;
  bearingDeg: number;
  isHeliport: boolean;
  hasHardRunway: boolean;
  longestFt: number;
}

function longestRunwayFt(runways: Runway[]): number {
  return runways.reduce((m, r) => Math.max(m, r.lengthFt ?? 0), 0);
}

/**
 * Airports within `maxNm` of `pos`, sorted by distance (primary). Near-ties
 * (within `tieNm`) prefer a hard surface, then a longer runway — but a closer
 * field is never hidden behind a farther one.
 */
export function nearestAirports(
  pos: LatLon,
  maxNm = 25,
  limit = 8,
  tieNm = 1.0,
): NearbyAirport[] {
  const list: NearbyAirport[] = [];
  for (const airport of AIRPORTS) {
    const d = distanceNm(pos, airport);
    if (d > maxNm) continue;
    list.push({
      airport,
      distanceNm: d,
      bearingDeg: bearingDeg(pos, airport),
      isHeliport: airport.type === "heliport",
      hasHardRunway: airport.runways.some((r) => r.hard),
      longestFt: longestRunwayFt(airport.runways),
    });
  }
  list.sort((a, b) => {
    if (Math.abs(a.distanceNm - b.distanceNm) > tieNm) return a.distanceNm - b.distanceNm;
    if (a.hasHardRunway !== b.hasHardRunway) return a.hasHardRunway ? -1 : 1;
    if (b.longestFt !== a.longestFt) return b.longestFt - a.longestFt;
    return a.distanceNm - b.distanceNm;
  });
  return list.slice(0, limit);
}

/** Best into-wind runway for an airport given current wind (null if calm/unknown). */
export function recommendRunway(airport: Airport, wind: Wind | null): RunwayRecommendation | null {
  return bestRunway(airport.runways, wind);
}
