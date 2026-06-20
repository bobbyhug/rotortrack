import { describe, expect, it } from "vitest";
import { bestRunway, windComponents } from "./components";
import { formatWind, parseMetar } from "./metar";
import type { Runway, Wind } from "../types";

describe("windComponents", () => {
  it("pure headwind straight down the runway", () => {
    const c = windComponents(90, 90, 10);
    expect(c.headwindKt).toBeCloseTo(10, 5);
    expect(c.crosswindKt).toBeCloseTo(0, 5);
    expect(c.tailwind).toBe(false);
  });
  it("pure crosswind from the right (90° off)", () => {
    const c = windComponents(90, 180, 10);
    expect(c.headwindKt).toBeCloseTo(0, 5);
    expect(c.crosswindKt).toBeCloseTo(10, 5);
    expect(c.crosswindSide).toBe("R");
  });
  it("crosswind from the left", () => {
    const c = windComponents(90, 0, 10);
    expect(c.crosswindKt).toBeCloseTo(10, 5);
    expect(c.crosswindSide).toBe("L");
  });
  it("pure tailwind (180° off)", () => {
    const c = windComponents(90, 270, 10);
    expect(c.headwindKt).toBeCloseTo(-10, 5);
    expect(c.tailwind).toBe(true);
  });
});

describe("bestRunway", () => {
  const rwy: Runway = {
    lengthFt: 5801,
    surface: "ASP",
    hard: true,
    le: { ident: "05", headingT: 50, lat: null, lon: null },
    he: { ident: "23", headingT: 230, lat: null, lon: null },
  };
  it("recommends the into-wind end", () => {
    const wind: Wind = { dirDegTrue: 30, speedKt: 10, gustKt: null, variable: false, station: "X", observedMs: Date.now(), raw: "" };
    const rec = bestRunway([rwy], wind);
    expect(rec?.end.ident).toBe("05");
    expect(rec?.components.headwindKt).toBeGreaterThan(9);
  });
  it("returns null for calm/variable", () => {
    const calm: Wind = { dirDegTrue: null, speedKt: 0, gustKt: null, variable: false, station: "X", observedMs: Date.now(), raw: "" };
    expect(bestRunway([rwy], calm)).toBeNull();
  });
});

describe("parseMetar", () => {
  it("parses a normal wind", () => {
    const w = parseMetar({ icaoId: "KEKQ", wdir: 240, wspd: 3, rawOb: "METAR KEKQ 200956Z AUTO 24003KT" });
    expect(w.dirDegTrue).toBe(240);
    expect(w.speedKt).toBe(3);
    expect(w.variable).toBe(false);
  });
  it("treats 00000KT as calm (dir null)", () => {
    const w = parseMetar({ icaoId: "KSME", wdir: 0, wspd: 0, rawOb: "METAR KSME 201015Z AUTO 00000KT" });
    expect(w.speedKt).toBe(0);
    expect(w.dirDegTrue).toBeNull();
    expect(formatWind(w)).toBe("CALM");
  });
  it("flags variable wind", () => {
    const w = parseMetar({ icaoId: "KX", wspd: 4, rawOb: "METAR KX VRB04KT" });
    expect(w.variable).toBe(true);
    expect(w.dirDegTrue).toBeNull();
  });
  it("captures gusts and formats", () => {
    const w = parseMetar({ icaoId: "KX", wdir: 290, wspd: 16, wgst: 25, rawOb: "29016G25KT" });
    expect(formatWind(w)).toBe("290@16G25");
  });
});
