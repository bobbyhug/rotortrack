// Unit conversions. Aviation uses nautical miles, knots, feet, degrees.

export const M_PER_NM = 1852;
export const FT_PER_M = 3.280839895;
export const KTS_PER_MPS = 1.943844492;
export const EARTH_R_NM = 6371000 / M_PER_NM; // ≈ 3440.07 nm

export const metersToNm = (m: number): number => m / M_PER_NM;
export const nmToMeters = (nm: number): number => nm * M_PER_NM;
export const metersToFt = (m: number): number => m * FT_PER_M;
export const mpsToKts = (mps: number): number => mps * KTS_PER_MPS;
export const ktsToMps = (kt: number): number => kt / KTS_PER_MPS;

export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Normalize degrees to [0, 360). */
export const norm360 = (d: number): number => ((d % 360) + 360) % 360;

/** Signed smallest difference b - a, in (-180, 180]. Positive = turn right. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}
