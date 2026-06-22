interface Props {
  mapBearingDeg: number; // current map rotation (0 = north-up)
}

/** Small compass needle that always points to true north (mid-right). */
export default function NorthArrow({ mapBearingDeg }: Props) {
  return (
    <div
      className="surface absolute right-2 top-[196px] flex items-center justify-center rounded-full"
      style={{ width: 42, height: 42 }}
    >
      <svg width="42" height="42" viewBox="0 0 42 42" style={{ transform: `rotate(${-mapBearingDeg}deg)` }}>
        <polygon points="21,4 16,21 21,17 26,21" fill="var(--color-red)" />
        <polygon points="21,38 16,21 21,25 26,21" fill="#9aa3af" />
        <text x="21" y="13" textAnchor="middle" fontSize="9" fontWeight="800" fill="#ffffff">
          N
        </text>
      </svg>
    </div>
  );
}
