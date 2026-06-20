import { describe, expect, it } from "vitest";
import { buildCtafCall, cardinalWord, ctafName } from "./ctaf";

describe("ctafName", () => {
  it("strips Airport / class words", () => {
    expect(ctafName("Wayne County Airport")).toBe("Wayne County");
    expect(ctafName("Lake Cumberland Regional Airport")).toBe("Lake Cumberland");
    expect(ctafName("Somewhere Municipal")).toBe("Somewhere");
  });
});

describe("cardinalWord", () => {
  it("maps bearings to spoken directions", () => {
    expect(cardinalWord(135)).toBe("southeast");
    expect(cardinalWord(0)).toBe("north");
    expect(cardinalWord(270)).toBe("west");
  });
});

describe("buildCtafCall", () => {
  const base = {
    fieldName: "Wayne County Airport",
    callsign: "Helicopter 63 Mike Papa",
    leftTraffic: true,
    runwayIdent: "21",
  };
  it("inbound call (not yet in pattern) uses miles + direction, bracketed by field", () => {
    const c = buildCtafCall({ ...base, distNm: 3.2, inboundFromDeg: 135, leg: null });
    expect(c).toBe(
      "Wayne County Traffic, Helicopter 63 Mike Papa, 3 miles southeast, inbound, landing Runway 21, Wayne County.",
    );
  });
  it("downwind call uses the leg + side + runway", () => {
    const c = buildCtafCall({ ...base, distNm: 1, inboundFromDeg: 135, leg: "DOWNWIND" });
    expect(c).toBe(
      "Wayne County Traffic, Helicopter 63 Mike Papa, left downwind, Runway 21, Wayne County.",
    );
  });
  it("final call", () => {
    const c = buildCtafCall({ ...base, distNm: 0.6, inboundFromDeg: 200, leg: "FINAL" });
    expect(c).toBe("Wayne County Traffic, Helicopter 63 Mike Papa, final, Runway 21, Wayne County.");
  });
  it("departure call when leaving the field", () => {
    const c = buildCtafCall({ ...base, distNm: 0.8, inboundFromDeg: 0, leg: null, departing: true });
    expect(c).toBe(
      "Wayne County Traffic, Helicopter 63 Mike Papa, departing to the north, Wayne County.",
    );
  });
  it("handles a single mile and no runway", () => {
    const c = buildCtafCall({ ...base, runwayIdent: null, distNm: 1.2, inboundFromDeg: 90, leg: null });
    expect(c).toBe(
      "Wayne County Traffic, Helicopter 63 Mike Papa, 1 mile east, inbound for landing, Wayne County.",
    );
  });
});
