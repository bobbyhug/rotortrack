import type { Destination } from "../types";

interface Props {
  saved: Destination[];
  nearby: Destination[]; // nearby airports (snapshot), nearest first
  selectedId: string;
  onSelect: (dest: Destination) => void;
  onClose: () => void;
}

function Row({
  d,
  selected,
  onSelect,
}: {
  d: Destination;
  selected: boolean;
  onSelect: (d: Destination) => void;
}) {
  return (
    <button
      className="focusable flex items-center justify-between rounded-xl px-3 py-3 text-left"
      style={{ background: "var(--color-surface)", borderColor: selected ? "var(--color-cyan)" : "transparent" }}
      onClick={() => onSelect(d)}
    >
      <span>
        <span className="block text-[18px] font-bold">
          {selected ? "▸ " : ""}
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
  );
}

/** Full-screen Direct-To picker (D-pad): saved places + nearby airports. */
export default function DestinationList({ saved, nearby, selectedId, onSelect, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/95 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[18px] font-extrabold tracking-wide" style={{ color: "var(--color-magenta)" }}>
          DIRECT TO
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
        <div className="text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
          SAVED
        </div>
        {saved.map((d) => (
          <Row key={d.id} d={d} selected={d.id === selectedId} onSelect={onSelect} />
        ))}

        {nearby.length > 0 && (
          <>
            <div className="mt-2 text-[11px] font-bold tracking-widest" style={{ color: "var(--color-muted)" }}>
              NEARBY AIRPORTS
            </div>
            {nearby.map((d) => (
              <Row key={d.id} d={d} selected={d.id === selectedId} onSelect={onSelect} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
