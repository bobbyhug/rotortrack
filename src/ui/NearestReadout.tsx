import type { NearbyAirport } from "../airports";
import type { RunwayRecommendation } from "../wind/components";
import { fmtDeg, fmtNm } from "./format";

interface Props {
  nearest: NearbyAirport | null;
  rec: RunwayRecommendation | null;
  windStale: boolean;
  reach: "in" | "marginal" | null;
  diverted: boolean;
}

/** Persistent low-clutter "nearest landable field" readout (top-right corner). */
export default function NearestReadout({ nearest, rec, windStale, reach, diverted }: Props) {
  if (!nearest) return null;
  const a = nearest.airport;
  const rwy = rec
    ? `RWY ${rec.end.ident} ${windStale ? "(wind n/a)" : `HW ${Math.round(rec.components.headwindKt)}kt`}`
    : "wind n/a";
  const reachColor =
    reach === "in" ? "var(--color-green)" : reach === "marginal" ? "var(--color-amber)" : "var(--color-muted)";
  return (
    <div
      className="surface absolute right-2 top-2 rounded-lg px-2.5 py-1.5 text-right"
      style={{ outline: diverted ? "2px solid var(--color-amber)" : "none" }}
    >
      <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
        {diverted ? "DIVERT →" : "NRST"}
      </div>
      <div className="text-[17px] font-extrabold leading-tight" style={{ color: "var(--color-cyan)" }}>
        {a.ident}
        {nearest.isHeliport ? " ⏶" : ""}
      </div>
      <div className="text-[14px] font-semibold leading-tight">
        {fmtNm(nearest.distanceNm)}nm {fmtDeg(nearest.bearingDeg)}°T
      </div>
      <div className="text-[13px] leading-tight" style={{ color: "var(--color-ink)" }}>{rwy}</div>
      {reach && (
        <div className="text-[11px] font-bold" style={{ color: reachColor }}>
          {reach === "in" ? "WITHIN GLIDE*" : "MARGINAL*"}
        </div>
      )}
    </div>
  );
}
