import type { Leg } from "../pattern/pattern";

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const WORD: Record<string, string> = {
  N: "north", NE: "northeast", E: "east", SE: "southeast",
  S: "south", SW: "southwest", W: "west", NW: "northwest",
};

/** Spoken cardinal ("southeast") for a true bearing. */
export const cardinalWord = (deg: number): string =>
  WORD[DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]];

/**
 * Spoken field name for CTAF: drop the trailing "Airport"/"Field" and a class
 * word ("Regional"/"Municipal"/…) so "Wayne County Airport" → "Wayne County"
 * and "Lake Cumberland Regional Airport" → "Lake Cumberland".
 */
export function ctafName(name: string): string {
  return name
    .trim()
    .replace(/\s+(airport|airpark|field|aerodrome|heliport)$/i, "")
    .replace(/\s+(regional|rgnl|municipal|muni|international|intl)$/i, "")
    .trim();
}

export interface CtafOpts {
  fieldName: string;
  callsign: string;
  distNm: number;
  inboundFromDeg: number; // bearing field → aircraft (where we're arriving from / departing toward)
  leg: Leg | null;
  leftTraffic: boolean;
  runwayIdent: string | null;
  departing?: boolean; // leaving the field rather than arriving
  altFtMsl?: number | null; // for the position report (rounded to nearest 100)
}

const IN_PATTERN: Leg[] = ["UPWIND", "CROSSWIND", "DOWNWIND", "BASE", "FINAL"];

/**
 * Build a VFR CTAF self-announce call for an uncontrolled field, bracketed by the
 * field name at both ends (standard phraseology). Advisory — pilot's discretion.
 */
export function buildCtafCall(o: CtafOpts): string {
  const field = ctafName(o.fieldName);
  const rwy = o.runwayIdent ? `runway ${o.runwayIdent}` : null;
  const side = o.leftTraffic ? "left" : "right";

  let body: string;
  if (o.leg && IN_PATTERN.includes(o.leg)) {
    const phrase =
      o.leg === "DOWNWIND" ? `${side} downwind`
      : o.leg === "BASE" ? `turning ${side} base`
      : o.leg === "CROSSWIND" ? `${side} crosswind`
      : o.leg === "FINAL" ? "final"
      : "upwind";
    body = rwy ? `${phrase} ${rwy}` : phrase;
  } else if (o.departing) {
    body = `departing to the ${cardinalWord(o.inboundFromDeg)}`;
  } else {
    const miles = Math.max(1, Math.round(o.distNm));
    const altFt = o.altFtMsl != null && o.altFtMsl >= 100 ? Math.round(o.altFtMsl / 100) * 100 : null;
    const alt = altFt != null ? `, ${altFt.toLocaleString("en-US")}` : "";
    body =
      `${miles} ${miles === 1 ? "mile" : "miles"} ${cardinalWord(o.inboundFromDeg)}${alt}, ` +
      `inbound for landing${rwy ? ` ${rwy}` : ""}`;
  }
  return `${field} Traffic, ${o.callsign}, ${body}, ${field}.`;
}
