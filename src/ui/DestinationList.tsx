import type { Destination } from "../types";

interface Props {
  destinations: Destination[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/** Full-screen destination picker (D-pad). Shows resolved coords for verification. */
export default function DestinationList({ destinations, selectedId, onSelect, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/95 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[18px] font-extrabold tracking-wide" style={{ color: "var(--color-cyan)" }}>
          DESTINATIONS
        </div>
        <button
          className="focusable rounded-lg px-3 py-2 text-[14px] font-bold"
          style={{ background: "var(--color-surface-2)" }}
          onClick={onClose}
        >
          ✕ Close
        </button>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {destinations.map((d) => (
          <button
            key={d.id}
            className="focusable flex items-center justify-between rounded-xl px-3 py-3 text-left"
            style={{
              background: "var(--color-surface)",
              borderColor: d.id === selectedId ? "var(--color-cyan)" : "transparent",
            }}
            onClick={() => onSelect(d.id)}
          >
            <span>
              <span className="block text-[18px] font-bold">
                {d.id === selectedId ? "▸ " : ""}
                {d.name}
              </span>
              <span className="block text-[12px]" style={{ color: "var(--color-muted)" }}>
                {d.lat.toFixed(5)}, {d.lon.toFixed(5)}
                {d.approx ? "  · verify" : ""}
              </span>
            </span>
            {d.ident && (
              <span className="text-[14px] font-bold" style={{ color: "var(--color-cyan)" }}>
                {d.ident}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
