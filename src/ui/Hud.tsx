import type { GpsStatus } from "../state/useFlightState";
import { fmtDeg, fmtEte, fmtKt, fmtNm } from "./format";

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

export default function Hud({ nav, gps }: { nav: Nav; gps: GpsStatus }) {
  const onTrack = nav.xtkNm != null && Math.abs(nav.xtkNm) < 0.1;
  return (
    <>
      {/* destination (top-left) */}
      <div className={`${box} absolute left-2 top-2 max-w-[230px]`}>
        <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
          {nav.diverted ? "DIVERT TO" : "DIRECT TO"}
        </div>
        <div className="truncate text-[18px] font-extrabold" style={{ color: "var(--color-magenta)" }}>
          {nav.targetName}
        </div>
      </div>

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
          {fmtEte(nav.eteSec)} · BRG {fmtDeg(nav.bearingDeg)}°
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
        {nav.turnDeg != null && !onTrack ? (
          <div className="text-[40px] font-extrabold leading-none" style={{ color: "var(--color-cyan)" }}>
            {nav.turnSide === "L" ? "‹ " : ""}
            {nav.turnDeg}°{nav.turnSide}
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
