import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Fix, LatLon } from "../types";
import { unwrapAngle } from "../geo/units";
import { DARK_STYLE, registerTileProtocol } from "./tiles";

registerTileProtocol();

// Own-ship: static fuselage (points up = north) + a translucent rotor DISC whose
// faint sweep/blades spin via CSS (compositor-driven). Heading is applied to the
// outer .ownship-rot wrapper (eased, shortest-path) so the disc keeps spinning
// independently. Additive-display safe: thin, low-alpha strokes, no bright fills.
const OWNSHIP_HTML = `
<div class="ownship-rot">
  <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <g class="rotor">
      <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(0,224,255,0.28)" stroke-width="2"/>
      <path d="M22 22 L22 5 A17 17 0 0 1 35 13 Z" fill="rgba(0,224,255,0.12)"/>
      <line x1="5" y1="22" x2="39" y2="22" stroke="rgba(0,224,255,0.5)" stroke-width="2" stroke-linecap="round"/>
      <line x1="22" y1="5" x2="22" y2="39" stroke="rgba(0,224,255,0.2)" stroke-width="1.5" stroke-linecap="round"/>
    </g>
    <g fill="none" stroke="#00e0ff" stroke-width="2.5" stroke-linecap="round">
      <line x1="22" y1="13" x2="22" y2="34"/>
      <polygon points="22,8 18,19 26,19" fill="#00e0ff" stroke="none"/>
      <line x1="16" y1="34" x2="28" y2="34"/>
    </g>
  </svg>
</div>`;

export interface MapViewProps {
  fix: Fix | null;
  /** active route line endpoints (own-ship → destination) */
  route: { from: LatLon; to: LatLon } | null;
  trackUp: boolean;
  fallbackCenter: LatLon;
}

export default function MapView({ fix, route, trackUp, fallbackCenter }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const ownshipRef = useRef<maplibregl.Marker | null>(null);
  const ownshipRootRef = useRef<HTMLDivElement | null>(null);
  const ownshipRotRef = useRef<HTMLDivElement | null>(null);
  const unwrappedRef = useRef(0); // accumulating heading (shortest-path)
  const readyRef = useRef(false);

  // init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [fallbackCenter.lon, fallbackCenter.lat],
      zoom: 11,
      attributionControl: false, // hidden on the lens; credit kept in README per OSM/CARTO terms
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    });
    mapRef.current = map;

    const el = document.createElement("div");
    el.className = "ownship";
    el.innerHTML = OWNSHIP_HTML;
    ownshipRootRef.current = el;
    ownshipRotRef.current = el.querySelector(".ownship-rot");
    ownshipRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([fallbackCenter.lon, fallbackCenter.lat])
      .addTo(map);

    map.on("load", () => {
      map.resize(); // ensure correct size once laid out
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ff39d6", "line-width": 3, "line-opacity": 0.95 },
      });
      readyRef.current = true;
    });

    // keep the GL canvas matched to the container (fixes half-height-at-init)
    const ro = new ResizeObserver(() => map.resize());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update own-ship + camera
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fix) return;
    ownshipRef.current?.setLngLat([fix.lon, fix.lat]);

    // heading on the icon: track-up → 0 (camera rotates); north-up → track.
    // Eased + shortest-path via the .ownship-rot wrapper's CSS transition.
    const want = trackUp ? 0 : fix.trackDeg;
    if (want != null && ownshipRotRef.current) {
      unwrappedRef.current = unwrapAngle(unwrappedRef.current, want);
      ownshipRotRef.current.style.transform = `rotate(${unwrappedRef.current}deg)`;
    }
    // pause the rotor when essentially stopped (on the ramp) to save power
    ownshipRootRef.current?.classList.toggle("parked", fix.gsKt < 3);

    map.easeTo({
      center: [fix.lon, fix.lat],
      bearing: trackUp ? (fix.trackDeg ?? 0) : 0,
      duration: 900,
    });
  }, [fix, trackUp]);

  // update route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(
      route
        ? {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [route.from.lon, route.from.lat],
                [route.to.lon, route.to.lat],
              ],
            },
          }
        : { type: "FeatureCollection", features: [] },
    );
  }, [route]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", top: 0, left: 0, width: 600, height: 600 }}
    />
  );
}
