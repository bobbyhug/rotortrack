# RotorTrack 🚁

A ForeFlight-style **VFR moving-map situational-awareness aid** for **Meta Ray-Ban Display**
glasses (and any mobile browser), for helicopter flying out of **KEKQ**. Direct-route guidance,
into-wind runway recommendations, traffic-pattern awareness, and nearest-airport/divert assist.

> ⚠️ **Situational-awareness aid only — VFR. Not for navigation or IFR, and not a certified EFB.**
> Wind, runway, traffic-pattern and reachability cues are **advisory**. Always defer to current
> charts, CTAF/ATC, and the pilot-in-command.

## Features
- **Moving map** (MapLibre GL, CARTO dark tiles), **north-up / track-up** toggle, helicopter own-ship,
  magenta **direct-route line**. Dist (nm), ground speed (kt), bearing, **ETE**, **cross-track** + a
  turn-correction cue ("turn 6° R").
- **Saved destinations** (KEKQ, Shawn's House, Conley Bottom, Lake House) — editable, persisted,
  swappable mid-flight; resolved coordinates shown for verification.
- **Wind/METAR** from the FAA AWC (nearest reporting station), with into-the-wind component vs. ground track.
- **Runway intelligence** — best into-wind runway per airport from live wind + OurAirports runway data
  ("Land RWY 05 — HW 8kt, xwind 3kt L") with a wind arrow.
- **Traffic-pattern awareness** on approach (≤3 nm): current leg (Upwind/Crosswind/Downwind/Base/Final),
  next leg, pattern altitude, rough AGL. Default LEFT traffic.
- **Nearest-airport / DIVERT** — persistent "NRST" readout; one tap snaps the route to the nearest field
  and back (RESUME); advisory reachability flag from a configurable R44 glide figure.
- **Offline tiles** cached in IndexedDB (corridor pre-cached); **mock mode** for development.

## Run locally
```bash
bun install
bun run build:airports   # one-time: generate src/data/airports.json from OurAirports
bun run dev              # http://localhost:5173
```
- **Controls:** arrow keys = D-pad (move focus), **Enter** = select, **Esc** = back; `d` = divert, `t` = track-up.
- **Mock mode (no flying):** open `http://localhost:5173/?mock=1` — simulates a flight KEKQ → selected destination.
- Test at **600×600** (Chrome DevTools device toolbar) to match the glasses.

## Tests
```bash
bun run test    # geo (great-circle/XTK), wind (components/METAR), pattern (leg detection) — 40 tests
```
Pure math lives in `src/geo`, `src/wind`, `src/pattern` and is unit-tested.

## Architecture
```
api/metar.ts        Vercel serverless METAR proxy (FAA AWC has no CORS) → same-origin + cache
scripts/            build-airports.mjs (OurAirports → regional JSON), shot.mjs (headless verify)
src/geo/            distance/bearing/cross-track/track + units
src/wind/           METAR parse + head/cross/tailwind components + best-runway
src/pattern/        traffic-pattern leg detection, pattern altitude, AGL
src/airports/       nearest ranking + best-runway; IndexedDB tile cache
src/state/          geolocation+compass, mock simulator, METAR hook, localStorage
src/map/            MapLibre view (dark tiles, route, own-ship, track-up) + tile cache protocol
src/ui/             Hud, NearestReadout, RunwayPanel, PatternPanel, DestinationList, Disclaimer, dpad
```
Web Workers were not needed (per-tick trig is trivial; MapLibre renders on the GPU). If profiling ever
shows jank, the geo/wind math in `src/geo` + `src/wind` are pure and worker-ready.

## Data sources (free, no API key)
- **Map tiles:** CARTO `dark_nolabels` (CORS-enabled). Attribution: © OpenStreetMap contributors, © CARTO.
- **Airports/runways:** OurAirports (public domain), pre-filtered to the operating region at build time.
- **Weather:** FAA Aviation Weather Center METAR API, via the bundled proxy.

## Deploy (Vercel — app + METAR proxy in one origin)
```bash
vercel        # first time: log in, link project
vercel --prod
```
The `/api/metar` function provides the CORS proxy on the same origin (no separate backend).

## Add to the glasses
Host on HTTPS (Vercel). In the **Meta AI app** (Developer Mode on): **App Settings → App Connections →
Web Apps → Add a Web App** → paste the HTTPS URL. Requires glasses sw v125+, Meta AI app v272+.

## Resolved destination coordinates (verify before flying)
| Name | Lat, Lon | Note |
|---|---|---|
| KEKQ (Home) | 36.8553, −84.8562 | OurAirports ARP; RWY 03/21 |
| Shawn's House | 37.097243, −84.982905 | user-provided |
| Conley Bottom | 36.9513, −84.8318 | resolved to Conley Bottom Marina — verify |
| Lake House | 36.93588, −85.03724 | exact street match |
