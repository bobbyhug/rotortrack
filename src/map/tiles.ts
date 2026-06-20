import maplibregl from "maplibre-gl";
import { getTile, putTile } from "../airports/cache";

// CARTO dark, no labels — dark = ideal for the additive display, CORS `*`, no key.
const CARTO = "https://cartodb-basemaps-a.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png";

let registered = false;

/**
 * Register a custom `rtt://` protocol so MapLibre tile requests are served from
 * IndexedDB first (offline reuse), falling back to network and caching the blob.
 * Service Workers are unsupported on the glasses, so this is the offline path.
 */
export function registerTileProtocol(): void {
  if (registered) return;
  registered = true;
  maplibregl.addProtocol("rtt", async (params) => {
    const url = params.url.replace(/^rtt:\/\//, "");
    const cached = await getTile(url);
    if (cached) return { data: await cached.arrayBuffer() };
    const res = await fetch(url);
    if (!res.ok) throw new Error(`tile ${res.status}`);
    const blob = await res.blob();
    void putTile(url, blob); // fire-and-forget cache write
    return { data: await blob.arrayBuffer() };
  });
}

export const DARK_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [`rtt://${CARTO}`],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © CARTO",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#000000" } },
    {
      id: "carto",
      type: "raster",
      source: "carto",
      paint: { "raster-opacity": 0.8, "raster-contrast": 0.1 },
    },
  ],
} as unknown as maplibregl.StyleSpecification;

/** Tile XYZ for a lat/lon at a zoom (for corridor pre-caching). */
export function tileXY(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latR = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latR)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Pre-fetch CARTO tiles covering a bbox at the given zooms into IndexedDB. */
export async function precacheBbox(
  box: { latMin: number; latMax: number; lonMin: number; lonMax: number },
  zooms = [9, 10, 11, 12],
): Promise<number> {
  let n = 0;
  for (const z of zooms) {
    const a = tileXY(box.latMax, box.lonMin, z);
    const b = tileXY(box.latMin, box.lonMax, z);
    for (let x = a.x; x <= b.x; x++) {
      for (let y = a.y; y <= b.y; y++) {
        const url = CARTO.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
        if (await getTile(url)) continue;
        try {
          const res = await fetch(url);
          if (res.ok) {
            await putTile(url, await res.blob());
            n++;
          }
        } catch {
          /* offline / skip */
        }
      }
    }
  }
  return n;
}
