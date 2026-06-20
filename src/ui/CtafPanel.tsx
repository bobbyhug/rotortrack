interface Props {
  call: string;
}

/**
 * Suggested CTAF self-announce call for the field being approached. Advisory —
 * read it, adapt it, and use your own judgment / actual CTAF frequency.
 * Dark band (transparent-ish on the additive display) with bright text.
 */
export default function CtafPanel({ call }: Props) {
  return (
    <div
      className="absolute bottom-[60px] left-1/2 w-[94%] -translate-x-1/2 rounded-lg px-3 py-1.5 text-center"
      style={{ background: "rgba(8,10,14,0.92)", border: "1px solid var(--color-amber)", zIndex: 30 }}
    >
      <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--color-amber)" }}>
        📻 CTAF — ADVISORY*
      </span>
      <div className="text-[13px] font-semibold leading-snug" style={{ color: "var(--color-ink)" }}>
        “{call}”
      </div>
    </div>
  );
}
