import { describe, expect, it } from "vitest";
import { poseAngles, vrmScale } from "./vrmPose";

describe("vrmScale", () => {
  it("身長170cmで本来1.7mのモデルは等倍", () => {
    expect(vrmScale(170, 1, 1.7).y).toBeCloseTo(1);
  });
  it("体重が重いほど横幅が広がる", () => {
    expect(vrmScale(170, 1.4, 1.7).x).toBeGreaterThan(vrmScale(170, 0.8, 1.7).x);
  });
});
describe("poseAngles", () => {
  it("座るポーズは太ももを前に90度", () => {
    expect(poseAngles("sit", 0).lt).toBeCloseTo(-Math.PI / 2);
  });
});
