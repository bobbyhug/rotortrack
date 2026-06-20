export const fmtNm = (n: number): string => (n >= 10 ? n.toFixed(0) : n.toFixed(1));
export const fmtKt = (k: number): string => String(Math.round(k));
export const fmtDeg = (d: number | null): string =>
  d == null ? "---" : String(Math.round(((d % 360) + 360) % 360)).padStart(3, "0");

const DIRS8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
/** 8-point compass label for a true bearing. */
export const cardinal8 = (d: number | null): string =>
  d == null ? "--" : DIRS8[Math.round((((d % 360) + 360) % 360) / 45) % 8];

/**
 * Estimated time enroute as a plain, unambiguous duration:
 *  under a minute → "<1 min", under an hour → "8 min", else "1h 23m".
 */
export function fmtEte(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return "--";
  const totalMin = Math.round(sec / 60);
  if (totalMin < 1) return "<1 min";
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
