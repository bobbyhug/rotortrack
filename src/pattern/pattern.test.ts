import { describe, expect, it } from "vitest";
import {
  aglEstimateFt,
  classifyLeg,
  detectPattern,
  patternAltitudeFt,
} from "./pattern";
import type { RunwayEnd } from "../types";

// LEFT traffic onto a north runway (heading 0): pattern is on the WEST side (cross<0).
describe("classifyLeg (left traffic, runway heading 0)", () => {
  const base = { leftTraffic: true };
  it("FINAL: aligned, on approach side", () => {
    expect(classifyLeg({ ...base, alongNm: -1, crossNm: 0, trackRel: 0 })).toBe("FINAL");
  });
  it("UPWIND: aligned, past threshold", () => {
    expect(classifyLeg({ ...base, alongNm: 1, crossNm: 0, trackRel: 0 })).toBe("UPWIND");
  });
  it("DOWNWIND: reversed track, pattern (west) side", () => {
    expect(classifyLeg({ ...base, alongNm: 0, crossNm: -0.6, trackRel: 180 })).toBe("DOWNWIND");
  });
  it("BASE: perpendicular near approach end, pattern side", () => {
    expect(classifyLeg({ ...base, alongNm: -0.1, crossNm: -0.6, trackRel: 90 })).toBe("BASE");
  });
  it("CROSSWIND: perpendicular near departure end, pattern side", () => {
    expect(classifyLeg({ ...base, alongNm: 1, crossNm: -0.6, trackRel: -90 })).toBe("CROSSWIND");
  });
  it("MANEUVERING when reversed but on the wrong side for left traffic", () => {
    // cross>0 is the RIGHT side; a left-traffic downwind must be on the left.
    expect(classifyLeg({ ...base, alongNm: 0, crossNm: 3, trackRel: 180 })).toBe("MANEUVERING");
  });
  it("aligned far past the threshold is still UPWIND", () => {
    expect(classifyLeg({ ...base, alongNm: 5, crossNm: 0, trackRel: 0 })).toBe("UPWIND");
  });
});

describe("classifyLeg right-traffic mirrors the side", () => {
  it("DOWNWIND on the east side when rightTraffic", () => {
    expect(classifyLeg({ leftTraffic: false, alongNm: 0, crossNm: 0.6, trackRel: 180 })).toBe("DOWNWIND");
    // same geometry but left-traffic would NOT be downwind (wrong side)
    expect(classifyLeg({ leftTraffic: true, alongNm: 0, crossNm: 0.6, trackRel: 180 })).toBe("MANEUVERING");
  });
});

describe("detectPattern (north runway, threshold at 37.0/-84.0)", () => {
  const end: RunwayEnd = { ident: "36", headingT: 0, lat: 37.0, lon: -84.0 };
  it("aircraft 1 nm south, tracking north → FINAL", () => {
    const r = detectPattern({ lat: 37.0 - 1 / 60, lon: -84.0 }, 0, end);
    expect(r?.leg).toBe("FINAL");
    expect(r?.nextLeg).toBeNull();
  });
  it("aircraft west, tracking south → DOWNWIND, next BASE", () => {
    const west = -84.0 - 0.6 / 60 / Math.cos((37 * Math.PI) / 180);
    const r = detectPattern({ lat: 37.0, lon: west }, 180, end);
    expect(r?.leg).toBe("DOWNWIND");
    expect(r?.nextLeg).toBe("BASE");
  });
  it("returns null without runway geometry", () => {
    expect(detectPattern({ lat: 37, lon: -84 }, 0, { ident: "x", headingT: null, lat: null, lon: null })).toBeNull();
  });
});

describe("altitudes", () => {
  it("pattern altitude = field elev + 1000", () => {
    expect(patternAltitudeFt(963)).toBe(1963);
    expect(patternAltitudeFt(963, 800)).toBe(1763);
    expect(patternAltitudeFt(null)).toBeNull();
  });
  it("AGL estimate", () => {
    expect(aglEstimateFt(1963, 963)).toBe(1000);
    expect(aglEstimateFt(null, 963)).toBeNull();
  });
});
