import type { PatternResult } from "../pattern/pattern";

interface Props {
  ident: string;
  result: PatternResult | null;
  runwayIdent: string | null;
  patternAltFt: number | null;
  aglFt: number | null;
}

const LABEL: Record<string, string> = {
  UPWIND: "UPWIND",
  CROSSWIND: "CROSSWIND",
  DOWNWIND: "DOWNWIND",
  BASE: "BASE",
  FINAL: "FINAL",
  MANEUVERING: "MANEUVERING",
};

/** Traffic-pattern awareness panel — shown on approach. Advisory. */
export default function PatternPanel({ ident, result, runwayIdent, patternAltFt, aglFt }: Props) {
  if (!result) return null;
  const side = result.leftTraffic ? "LEFT" : "RIGHT";
  return (
    <div className="surface absolute left-2 bottom-24 rounded-lg px-2.5 py-1.5">
      <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
        {ident} PATTERN — ADVISORY*
      </div>
      <div className="text-[20px] font-extrabold" style={{ color: "var(--color-cyan)" }}>
        {side} {LABEL[result.leg]} {runwayIdent ? `RWY ${runwayIdent}` : ""}
      </div>
      <div className="text-[12px]">
        {result.nextLeg ? `next: ${LABEL[result.nextLeg]}` : "next: land"}
        {patternAltFt != null ? ` · TPA ${patternAltFt}ʼ` : ""}
        {aglFt != null ? ` · ~${aglFt}ʼ AGL*` : ""}
      </div>
    </div>
  );
}
