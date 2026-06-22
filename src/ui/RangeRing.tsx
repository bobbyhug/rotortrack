interface Props {
  zoom: number;
  lat: number;
}

const R_PX = 110; // ring radius in CSS px (own-ship is screen-centered)

/** Faint distance ring centered on own-ship, labeled with its radius in nm. */
export default function RangeRing({ zoom, lat }: Props) {
  // Web Mercator ground resolution (meters per CSS pixel) at this zoom/latitude.
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  const nm = (R_PX * mpp) / 1852;
  const label = nm >= 10 ? nm.toFixed(0) : nm.toFixed(1);
  return (
    <svg className="pointer-events-none absolute inset-0" width="600" height="600" style={{ zIndex: 4 }}>
      <circle
        cx="300"
        cy="300"
        r={R_PX}
        fill="none"
        stroke="rgba(0,224,255,0.3)"
        strokeWidth="1.5"
        strokeDasharray="3 7"
      />
      <text
        x="300"
        y={300 - R_PX - 6}
        textAnchor="middle"
        fill="rgba(0,224,255,0.75)"
        fontSize="12"
        fontWeight="700"
      >
        {label} nm
      </text>
    </svg>
  );
}
