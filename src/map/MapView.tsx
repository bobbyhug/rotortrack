import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Fix, LatLon } from "../types";
import { DARK_STYLE, registerTileProtocol } from "./tiles";

registerTileProtocol();

const OWNSHIP_SVG = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#00e0ff" stroke-width="2.5" stroke-linecap="round">
    <line x1="20" y1="4" x2="20" y2="30"/>          <!-- main rotor mast / nose -->
    <line x1="6" y1="10" x2="34" y2="10"/>           <!-- main rotor -->
    <line x1="14" y1="30" x2="26" y2="30"/>          <!-- tail rotor / skids -->
    <polygon points="20,4 15,16 25,16" fill="#00e0ff" stroke="none"/> <!-- nose arrow -->
  </g>
</svg>`;

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
  const readyRef = useRef(false);

  // init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [fallbackCenter.lon, fallbackCenter.lat],
      zoom: 11,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    });
    mapRef.current = map;

    const el = document.createElement("div");
    el.innerHTML = OWNSHIP_SVG;
    ownshipRef.current = new maplibregl.Marker({ element: el, rotationAlignment: "map" })
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
    ownshipRef.current?.setRotation(fix.trackDeg ?? 0);
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
