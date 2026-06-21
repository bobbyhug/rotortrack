interface Props {
  onDismiss: () => void;
}

/** One-time first-run gesture hint over the map. Dismissed (and remembered) on pinch. */
export default function HintOverlay({ onDismiss }: Props) {
  return (
    <div
      className="absolute left-1/2 top-1/2 z-40 w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-xl px-4 py-4 text-center"
      style={{ background: "rgba(8,10,14,0.94)", border: "1px solid var(--color-cyan)" }}
    >
      <div className="text-[12px] font-bold tracking-widest" style={{ color: "var(--color-cyan)" }}>
        GETTING AROUND
      </div>
      <div className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--color-ink)" }}>
        <div>↔ <b>swipe</b> = move highlight</div>
        <div>● <b>pinch</b> = select</div>
        <div className="mt-2">
          Pinch <b style={{ color: "var(--color-magenta)" }}>DIRECT TO ▾</b> (top-left) to choose where to go.
        </div>
      </div>
      <button
        className="focusable mt-4 rounded-xl px-6 py-3 text-[15px] font-bold"
        style={{ background: "var(--color-surface-2)", color: "var(--color-cyan)" }}
        autoFocus
        onClick={onDismiss}
      >
        Got it
      </button>
    </div>
  );
}
