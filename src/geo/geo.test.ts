import { describe, expect, it } from "vitest";
import {
  bearingDeg,
  crossTrack,
  destinationPoint,
  distanceNm,
  eteSeconds,
} from "./greatCircle";
import { trackFromPositions, turnCue } from "./track";
import { angleDelta, norm360 } from "./units";

describe("distanceNm", () => {
  it("is zero for identical points", () => {
    expect(distanceNm({ lat: 36.85, lon: -84.85 }, { lat: 36.85, lon: -84.85 })).toBe(0);
  });
  it("≈ 60 nm per degree of latitude", () => {
    expect(distanceNm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(60, 0);
  });
  it("≈ 60 nm per degree of longitude at the equator", () => {
    expect(distanceNm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(60, 0);
  });
  it("KEKQ→KSME is ~16–17 nm", () => {
    const d = distanceNm({ lat: 36.8553, lon: -84.8562 }, { lat: 37.0529, lon: -84.6141 });
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(18);
  });
});

describe("bearingDeg", () => {
  it("cardinals from origin", () => {
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 1);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 1);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: -1, lon: 0 })).toBeCloseTo(180, 1);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: -1 })).toBeCloseTo(270, 1);
  });
});

describe("crossTrack", () => {
  const a = { lat: 0, lon: 0 };
  const b = { lat: 0, lon: 1 }; // eastbound leg, course 090
  it("flags a point north of an eastbound leg as LEFT, ~6 nm", () => {
    const xt = crossTrack({ lat: 0.1, lon: 0.5 }, a, b);
    expect(xt.side).toBe("L");
    expect(xt.xtkNm).toBeCloseTo(-6, 0);
  });
  it("flags a point south of an eastbound leg as RIGHT", () => {
    const xt = crossTrack({ lat: -0.1, lon: 0.5 }, a, b);
    expect(xt.side).toBe("R");
    expect(xt.xtkNm).toBeGreaterThan(0);
  });
  it("is ~0 on the course line", () => {
    expect(crossTrack({ lat: 0, lon: 0.5 }, a, b).xtkNm).toBeCloseTo(0, 2);
  });
});

describe("destinationPoint", () => {
  it("60 nm east of origin ≈ (0, 1)", () => {
    const p = destinationPoint({ lat: 0, lon: 0 }, 90, 60);
    expect(p.lat).toBeCloseTo(0, 2);
    expect(p.lon).toBeCloseTo(1, 2);
  });
});

describe("eteSeconds", () => {
  it("60 nm @ 60 kt = 3600 s", () => {
    expect(eteSeconds(60, 60)).toBeCloseTo(3600, 0);
  });
  it("null when stopped", () => {
    expect(eteSeconds(10, 0)).toBeNull();
  });
});

describe("angleDelta / norm360", () => {
  it("wraps correctly", () => {
    expect(angleDelta(350, 10)).toBe(20);
    expect(angleDelta(10, 350)).toBe(-20);
    expect(angleDelta(0, 180)).toBe(180);
    expect(angleDelta(0, 181)).toBe(-179);
    expect(norm360(-10)).toBe(350);
    expect(norm360(370)).toBe(10);
  });
});

describe("turnCue", () => {
  it("turn right toward a target slightly right of track", () => {
    expect(turnCue(0, 6)).toEqual({ deg: 6, side: "R" });
  });
  it("turn left toward a target slightly left of track", () => {
    expect(turnCue(0, 354)).toEqual({ deg: 6, side: "L" });
  });
  it("handles wrap across north", () => {
    expect(turnCue(350, 10)).toEqual({ deg: 20, side: "R" });
  });
});

describe("trackFromPositions", () => {
  it("northbound movement → ~000°", () => {
    expect(trackFromPositions({ lat: 0, lon: 0 }, { lat: 0.01, lon: 0 })).toBeCloseTo(0, 0);
  });
  it("returns null for jitter under threshold", () => {
    expect(trackFromPositions({ lat: 0, lon: 0 }, { lat: 0.00001, lon: 0 })).toBeNull();
  });
});
