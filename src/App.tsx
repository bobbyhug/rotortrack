import { useEffect, useMemo, useState } from "react";
import type { LatLon } from "./types";
import { bearingDeg, crossTrack, distanceNm, eteSeconds } from "./geo/greatCircle";
import { turnCue } from "./geo/track";
import { angleDelta } from "./geo/units";
import { airportByIdent, nearestAirports, recommendRunway } from "./airports";
import { windComponents } from "./wind/components";
import { formatWind, isStale } from "./wind/metar";
import { aglEstimateFt, detectPattern, patternAltitudeFt } from "./pattern/pattern";
import { buildCtafCall } from "./ctaf/ctaf";
import { DEFAULT_DESTINATIONS } from "./data/destinations";
import { useFlightState } from "./state/useFlightState";
import { useMock } from "./state/useMock";
import { useWind } from "./state/useWind";
import {
  ackDisclaimer,
  disclaimerAck,
  loadDestinations,
  loadLastFix,
  loadSettings,
  saveSettings,
} from "./state/storage";
import { precacheBbox } from "./map/tiles";
import MapView from "./map/MapView";
import Hud, { type Nav } from "./ui/Hud";
import NearestReadout from "./ui/NearestReadout";
import RunwayPanel from "./ui/RunwayPanel";
import PatternPanel from "./ui/PatternPanel";
import DestinationList from "./ui/DestinationList";
import CtafPanel from "./ui/CtafPanel";
import Disclaimer from "./ui/Disclaimer";
import { useDpad } from "./ui/dpad";

const MOCK = /[?&]mock/.test(location.search);
const HOME: LatLon = { lat: DEFAULT_DESTINATIONS[0].lat, lon: DEFAULT_DESTINATIONS[0].lon };
const CORRIDOR = { latMin: 36.6, latMax: 37.2, lonMin: -85.15, lonMax: -84.6 };

export default function App() {
  const [acked, setAcked] = useState(disclaimerAck());
  const [destinations] = useState(loadDestinations);
  const [selectedId, setSelectedId] = useState(
    destinations.find((d) => d.id === "shawns")?.id ?? destinations[0].id,
  );
  const [diverted, setDiverted] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [legOrigin, setLegOrigin] = useState<LatLon>(loadLastFix() ?? HOME);

  const selected = destinations.find((d) => d.id === selectedId) ?? destinations[0];

  // own-ship: mock simulator or real sensors
  const real = useFlightState(!MOCK);
  const mock = useMock(MOCK, HOME, { lat: selected.lat, lon: selected.lon });
  const { fix, status } = MOCK ? mock : real;
  const wind = useWind(MOCK);

  // pre-cache corridor tiles once (best-effort)
  useEffect(() => {
    void precacheBbox(CORRIDOR);
  }, []);

  // reset the course-line origin when the leg target changes
  useEffect(() => {
    setLegOrigin(fix ?? loadLastFix() ?? HOME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, diverted]);

  const center = fix ?? loadLastFix() ?? HOME;
  const nearestList = useMemo(() => (fix ? nearestAirports(fix, 25) : []), [fix]);
  const nearest = nearestList[0] ?? null;
  const nearestWind = nearest ? wind.near(nearest.airport) : null;
  const nearestRec = nearest ? recommendRunway(nearest.airport, nearestWind) : null;

  // active target: divert → nearest airport; else selected destination
  const target = useMemo(() => {
    if (diverted && nearest) {
      return { lat: nearest.airport.lat, lon: nearest.airport.lon, name: nearest.airport.ident };
    }
    return { lat: selected.lat, lon: selected.lon, name: selected.name };
  }, [diverted, nearest, selected]);

  // nav math
  const nav: Nav = useMemo(() => {
    if (!fix) {
      return {
        targetName: target.name, diverted, distNm: null, bearingDeg: null, eteSec: null,
        gsKt: null, trackDeg: null, xtkNm: null, xtkSide: null, turnDeg: null, turnSide: null,
        windText: formatWind(wind.near(HOME)), windCompKt: null, windCompLabel: null,
      };
    }
    const distNm = distanceNm(fix, target);
    const brg = bearingDeg(fix, target);
    const xt = crossTrack(fix, legOrigin, target);
    const cue = fix.trackDeg != null ? turnCue(fix.trackDeg, brg) : null;
    const w = wind.near(fix);
    let windCompKt: number | null = null;
    let windCompLabel: string | null = null;
    if (w && w.dirDegTrue != null && fix.trackDeg != null) {
      const wc = windComponents(fix.trackDeg, w.dirDegTrue, w.speedKt);
      if (Math.abs(wc.headwindKt) >= wc.crosswindKt) {
        windCompKt = Math.round(Math.abs(wc.headwindKt));
        windCompLabel = wc.tailwind ? "TAILWIND" : "HEADWIND";
      } else {
        windCompKt = Math.round(wc.crosswindKt);
        windCompLabel = `XWIND ${wc.crosswindSide}`;
      }
    }
    return {
      targetName: target.name, diverted, distNm, bearingDeg: brg,
      eteSec: eteSeconds(distNm, fix.gsKt), gsKt: fix.gsKt, trackDeg: fix.trackDeg,
      xtkNm: xt.xtkNm, xtkSide: xt.side, turnDeg: cue?.deg ?? null, turnSide: cue?.side ?? null,
      windText: formatWind(w), windCompKt, windCompLabel,
    };
  }, [fix, target, legOrigin, wind, diverted]);

  // approach airport (for runway + pattern), within 3 nm
  const approach = useMemo(() => {
    if (!fix) return null;
    const destAirport = selected.ident ? airportByIdent(selected.ident) : undefined;
    const cand = !diverted && destAirport ? destAirport : nearest?.airport;
    if (!cand) return null;
    const d = distanceNm(fix, cand);
    if (d > 3) return null;
    const w = wind.near(cand);
    const rec = recommendRunway(cand, w);
    const pattern =
      rec && fix.trackDeg != null ? detectPattern(fix, fix.trackDeg, rec.end) : null;
    return {
      airport: cand,
      rec,
      pattern,
      patternAlt: patternAltitudeFt(cand.elevationFt, settings.tpaAgl),
      agl: aglEstimateFt(fix.altFtMsl, cand.elevationFt),
      windStale: isStale(w),
      inboundFrom: bearingDeg(cand, fix), // bearing field→aircraft = the direction we're arriving from
    };
  }, [fix, selected, diverted, nearest, wind, settings.tpaAgl]);

  // suggested CTAF self-announce call for the field we're approaching (≤10 nm)
  const ctaf = useMemo(() => {
    if (!fix) return null;
    const destAirport = selected.ident ? airportByIdent(selected.ident) : undefined;
    const cand = !diverted && destAirport ? destAirport : nearest?.airport;
    if (!cand) return null;
    const d = distanceNm(fix, cand);
    if (d > 10) return null;
    const rec = recommendRunway(cand, wind.near(cand));
    const pattern = rec && fix.trackDeg != null ? detectPattern(fix, fix.trackDeg, rec.end) : null;

    // Are we arriving at this field, in its pattern, or departing it?
    const goingThere = diverted || !!destAirport; // targeted an airport (dest or divert)
    const inLeg = !!pattern && pattern.leg !== "MANEUVERING";
    const closing =
      fix.trackDeg == null || Math.abs(angleDelta(fix.trackDeg, bearingDeg(fix, cand))) < 100;
    const departing = !goingThere && !inLeg && !closing && d <= 2.5;
    if (!goingThere && !inLeg && !closing && !departing) return null; // transiting → no call

    return {
      call: buildCtafCall({
        fieldName: cand.name,
        callsign: settings.callsign,
        distNm: d,
        inboundFromDeg: bearingDeg(cand, fix),
        leg: pattern?.leg ?? null,
        leftTraffic: pattern?.leftTraffic ?? true,
        runwayIdent: rec?.end.ident ?? null,
        departing,
      }),
    };
  }, [fix, selected, diverted, nearest, wind, settings.callsign]);

  // reachability (advisory) for nearest field
  const reach = useMemo<"in" | "marginal" | null>(() => {
    if (!fix || !nearest) return null;
    const agl = aglEstimateFt(fix.altFtMsl, nearest.airport.elevationFt);
    if (agl == null || agl <= 0) return null;
    const glideNm = (agl / 6076) * settings.glideRatio;
    if (nearest.distanceNm <= glideNm) return "in";
    if (nearest.distanceNm <= glideNm * 1.3) return "marginal";
    return null;
  }, [fix, nearest, settings.glideRatio]);

  // toggles
  const toggleTrackUp = () => {
    const s = { ...settings, trackUp: !settings.trackUp };
    setSettings(s);
    saveSettings(s);
  };
  const toggleDivert = () => nearest && setDiverted((v) => !v);
  const pickDest = (id: string) => {
    setSelectedId(id);
    setDiverted(false);
    setListOpen(false);
  };

  // extra hotkeys (d=divert, t=track-up) on top of the D-pad rail
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") toggleDivert();
      if (e.key === "t" || e.key === "T") toggleTrackUp();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  useDpad(() => setListOpen(false));

  if (!acked) {
    return (
      <Disclaimer
        onAck={() => {
          ackDisclaimer();
          setAcked(true);
        }}
      />
    );
  }

  return (
    <div className="relative h-[600px] w-[600px] overflow-hidden bg-black">
      <MapView fix={fix} route={fix ? { from: fix, to: target } : null} trackUp={settings.trackUp} fallbackCenter={center} />

      <Hud nav={nav} gps={status} />
      <NearestReadout nearest={nearest} rec={nearestRec} windStale={isStale(nearestWind)} reach={reach} diverted={diverted} />
      {approach && (
        <>
          <RunwayPanel ident={approach.airport.ident} rec={approach.rec} wind={wind.near(approach.airport)} windStale={approach.windStale} />
          <PatternPanel
            ident={approach.airport.ident}
            result={approach.pattern}
            runwayIdent={approach.rec?.end.ident ?? null}
            patternAltFt={approach.patternAlt}
            aglFt={approach.agl}
            inboundFromDeg={approach.inboundFrom}
          />
        </>
      )}

      {ctaf && <CtafPanel call={ctaf.call} />}

      {/* action rail (D-pad) */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
        <button className="focusable surface rounded-xl px-4 py-3 text-[15px] font-bold" autoFocus onClick={() => setListOpen(true)}>
          ▸ DEST
        </button>
        <button
          className="focusable surface rounded-xl px-4 py-3 text-[15px] font-bold"
          style={{ color: diverted ? "var(--color-amber)" : "var(--color-red)" }}
          disabled={!nearest}
          onClick={toggleDivert}
        >
          {diverted ? `RESUME ${selected.ident ?? "DEST"}` : "⚠ DIVERT"}
        </button>
        <button className="focusable surface rounded-xl px-4 py-3 text-[15px] font-bold" onClick={toggleTrackUp}>
          {settings.trackUp ? "TRK↑" : "N↑"}
        </button>
      </div>

      {/* advisory footer */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px]" style={{ color: "var(--color-muted)" }}>
        ADVISORY ONLY · VFR · not for navigation {MOCK ? "· MOCK" : ""}
      </div>

      {listOpen && (
        <DestinationList destinations={destinations} selectedId={selectedId} onSelect={pickDest} onClose={() => setListOpen(false)} />
      )}
    </div>
  );
}
