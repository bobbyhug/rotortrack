interface Props {
  onAck: () => void;
}

/** One-time launch disclaimer. SA aid only — VFR, not for navigation/IFR. */
export default function Disclaimer({ onAck }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 text-center">
      <div className="text-cyan text-2xl font-extrabold tracking-widest" style={{ color: "var(--color-cyan)" }}>
        ROTORTRACK
      </div>
      <div className="mt-4 max-w-[520px] text-[15px] leading-snug text-white">
        Situational-awareness aid only — <b>VFR</b>. Not for navigation or IFR, and
        <b> not a certified EFB</b>. Wind, runway, traffic-pattern and reachability
        cues are <b>advisory</b>. Always defer to current charts, CTAF/ATC, and the
        pilot-in-command.
      </div>
      <button
        className="focusable mt-7 rounded-xl px-8 py-4 text-lg font-bold"
        style={{ background: "var(--color-surface-2)", color: "var(--color-cyan)" }}
        autoFocus
        onClick={onAck}
      >
        I understand
      </button>
    </div>
  );
}
