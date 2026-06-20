export const fmtNm = (n: number): string => (n >= 10 ? n.toFixed(0) : n.toFixed(1));
export const fmtKt = (k: number): string => String(Math.round(k));
export const fmtDeg = (d: number | null): string =>
  d == null ? "---" : String(Math.round(((d % 360) + 360) % 360)).padStart(3, "0");

export function fmtEte(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return "--:--";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}`
    : `${m}:${String(ss).padStart(2, "0")}`;
}
