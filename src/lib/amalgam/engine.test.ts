import { describe, it, expect } from "vitest";
import { amalgam, aprTension, gramResonance, breathes, normalize, DIMS, type Vec } from "./engine";
const v = (x: number): Vec => Object.fromEntries(DIMS.map(d => [d, x])) as Vec;
describe("Δ engine (Manual 2026.9.2 + APR v2)", () => {
  it("amalgam is √(A·B)", () => { expect(amalgam(v(0.81), v(0.25)).T).toBeCloseTo(0.45); });
  it("τ = 0 for parallel views, 1 for orthogonal", () => {
    expect(aprTension(v(0.3), v(0.9))).toBeCloseTo(0);
    const a = normalize({ T: 1 }); const b = normalize({ E: 1 });
    DIMS.forEach(d => { if (d !== "T") a[d] = 0; if (d !== "E") b[d] = 0; });
    expect(aprTension(a, b)).toBeCloseTo(1);
  });
  it("equal Gram ⇒ ρ = 0 (rotated family resonates)", () => {
    expect(gramResonance([[1, 0], [0, 2]], [[0, 1], [-2, 0]])).toBeCloseTo(0);
  });
  it("0.0 is a valid pole and I3 detects frozen breath", () => {
    const n = normalize({ "φe": 0, "φc": 0.5 });
    expect(n["φe"]).toBe(0);
    expect(breathes(n)).toBe(false);
  });
});

import { toSignature as _sig, nestSignature as _nest } from "./engine";
describe("canonical signature (Manual §2–§4)", () => {
  it("opens with Ξ and nests one symbol per level", () => {
    expect(_nest(["R", "V", "M", "φe"])).toBe("Ξ { R { V { M { φe } } } }");
  });
  it("empty field is bare Ξ", () => {
    const v: any = {}; ["Ξ","T","R","E","M","V","S","A","F","φe","φc"].forEach(d => v[d] = 0.1);
    expect(_sig(v)).toBe("Ξ");
  });
});
