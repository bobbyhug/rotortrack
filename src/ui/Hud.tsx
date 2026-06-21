import type { GpsStatus } from "../state/useFlightState";
import { cardinal8, fmtDeg, fmtEte, fmtKt, fmtNm } from "./format";

export interface Nav {
  targetName: string;
  diverted: boolean;
  distNm: number | null;
  bearingDeg: number | null;
  eteSec: number | null;
  gsKt: number | null;
  trackDeg: number | null;
  xtkNm: number | null;
  xtkSide: "L" | "R" | null;
  turnDeg: number | null;
  turnSide: "L" | "R" | null;
  windText: string;
  windCompKt: number | null;
  windCompLabel: string | null;
}

const box = "surface rounded-lg px-2.5 py-1.5";

const TURN_DEADBAND_DEG = 3; // ignore sub-3° corrections (below GPS-heading noise)

export default function Hud({
  nav,
  gps,
  onOpenDest,
}: {
  nav: Nav;
  gps: GpsStatus;
  onOpenDest: () => void;
}) {
  // Show a turn cue only when the correction is worth a control input; round to
  // the nearest 5° so it reads cleanly (5°R / 10°L) instead of jittering by 1°.
  const showCue = nav.turnDeg != null && nav.turnDeg >= TURN_DEADBAND_DEG;
  const cueDeg = nav.turnDeg != null ? Math.round(nav.turnDeg / 5) * 5 : 0;
  return (
    <>
      {/* destination (top-left) — tap to change Direct-To target */}
      <button
        className={`${box} focusable absolute left-2 top-2 max-w-[240px] text-left`}
        onClick={onOpenDest}
      >
        <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
          {nav.diverted ? "DIVERT TO" : "DIRECT TO ▾"}
        </div>
        <div className="truncate text-[18px] font-extrabold" style={{ color: "var(--color-magenta)" }}>
          {nav.targetName}
        </div>
      </button>

      {/* distance + ETE (top-right under NRST handled separately) */}
      <div className={`${box} absolute right-2 top-[88px] text-right`}>
        <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
          DIST · ETE
        </div>
        <div className="text-[26px] font-extrabold leading-none" style={{ color: "var(--color-ink)" }}>
          {nav.distNm != null ? fmtNm(nav.distNm) : "--"}
          <span className="text-[14px] font-bold"> nm</span>
        </div>
        <div className="text-[15px] font-bold" style={{ color: "var(--color-cyan)" }}>
          {fmtEte(nav.eteSec)} · BRG {fmtDeg(nav.bearingDeg)}° {cardinal8(nav.bearingDeg)}
        </div>
      </div>

      {/* wind bug (top-center) */}
      <div className={`${box} absolute left-1/2 top-2 -translate-x-1/2 text-center`}>
        <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-amber)" }}>
          WIND*
        </div>
        <div className="text-[15px] font-bold">{nav.windText}</div>
        {nav.windCompLabel && (
          <div className="text-[13px] font-bold" style={{ color: "var(--color-amber)" }}>
            {nav.windCompKt}kt {nav.windCompLabel}
          </div>
        )}
      </div>

      {/* correction cue + XTE (center-left) */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-left">
        {showCue ? (
          <div className="text-[40px] font-extrabold leading-none" style={{ color: "var(--color-cyan)" }}>
            {nav.turnSide === "L" ? "‹ " : ""}
            {cueDeg}°{nav.turnSide}
            {nav.turnSide === "R" ? " ›" : ""}
          </div>
        ) : (
          <div className="text-[24px] font-extrabold" style={{ color: "var(--color-green)" }}>
            ON TRACK
          </div>
        )}
        <div className="text-[13px] font-bold" style={{ color: "var(--color-muted)" }}>
          XTK {nav.xtkNm != null ? `${Math.abs(nav.xtkNm).toFixed(1)}nm ${nav.xtkSide}` : "--"}
        </div>
      </div>

      {/* ground speed + track (bottom-left) */}
      <div className={`${box} absolute left-2 bottom-14`}>
        <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
          GS · TRK
        </div>
        <div className="text-[22px] font-extrabold leading-none">
          {nav.gsKt != null ? fmtKt(nav.gsKt) : "--"}
          <span className="text-[13px] font-bold"> kt</span>
          <span className="ml-2" style={{ color: "var(--color-cyan)" }}>
            {fmtDeg(nav.trackDeg)}°
          </span>
        </div>
      </div>

      {gps !== "ok" && (
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 rounded-lg px-3 py-2 text-[14px] font-bold"
          style={{ background: "var(--color-surface-2)", color: "var(--color-amber)" }}
        >
          {gps === "searching" ? "GPS acquiring…" : "GPS unavailable"}
        </div>
      )}
    </>
  );
}
