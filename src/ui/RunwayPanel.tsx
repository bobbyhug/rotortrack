import type { Wind } from "../types";
import type { RunwayRecommendation } from "../wind/components";
import { formatWind } from "../wind/metar";

interface Props {
  ident: string;
  rec: RunwayRecommendation | null;
  wind: Wind | null;
  windStale: boolean;
}

/** Recommended into-wind runway + components + a simple wind arrow vs runway. */
export default function RunwayPanel({ ident, rec, wind, windStale }: Props) {
  if (!rec) {
    return (
      <div className="surface absolute left-2 top-[84px] rounded-lg px-2.5 py-1.5">
        <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
          {ident} RWY
        </div>
        <div className="text-[14px]">{wind ? "wind calm/variable" : "wind n/a"}</div>
      </div>
    );
  }
  const c = rec.components;
  // arrow points the direction the wind is going (downwind), rotated to runway-up frame
  const rel = wind?.dirDegTrue != null && rec.end.headingT != null ? wind.dirDegTrue - rec.end.headingT : 0;
  return (
    <div className="surface absolute left-2 top-[84px] rounded-lg px-2.5 py-1.5">
      <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
        {ident} — LAND {windStale ? "(advisory*)" : "ADVISORY*"}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[22px] font-extrabold" style={{ color: "var(--color-green)" }}>
          RWY {rec.end.ident}
        </div>
        <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: `rotate(${rel}deg)` }}>
          <line x1="13" y1="3" x2="13" y2="23" stroke="var(--color-amber)" strokeWidth="2.5" />
          <polygon points="13,23 9,16 17,16" fill="var(--color-amber)" />
        </svg>
      </div>
      <div className="text-[13px]">
        HW {Math.round(c.headwindKt)}kt · X {Math.round(c.crosswindKt)}kt {c.crosswindSide}
        {c.tailwind ? " · TAILWIND" : ""}
      </div>
      <div className="text-[11px]" style={{ color: "var(--color-muted)" }}>
        wind {formatWind(wind)}
      </div>
    </div>
  );
}
