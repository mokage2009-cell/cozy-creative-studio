import { describe, expect, it } from "vitest";
import { DEFAULT_FURNITURE } from "./catalog";
import { parseChat, plantGrowth, planCommand, seededTown } from "./logic";

describe("game rules", () => {
  it("plant grows by elapsed hours since last time", () => {
    expect(plantGrowth(1, 4 * 3_600_000)).toBeCloseTo(2);
  });
  it("plant growth is capped", () => {
    expect(plantGrowth(1, 1000 * 3_600_000)).toBe(3);
  });
  it("chat 'ベッドで寝て' targets the bed with sleep pose", () => {
    const c = parseChat("ベッドで寝て", DEFAULT_FURNITURE);
    expect(c.targetUid).toBe("f-bed");
    expect(c.pose).toBe("sleep");
  });
  it("chat quoted text becomes the line", () => {
    expect(parseChat("ソファに座って「疲れた〜」", DEFAULT_FURNITURE).say).toBe("疲れた〜");
  });
  it("touching the kettle triggers burn", () => {
    expect(parseChat("ヤカンを触って", DEFAULT_FURNITURE).pose).toBe("burn");
  });
  it("sitting on sofa lowers avatar so hips are at seat height", () => {
    const p = planCommand({ targetUid: "f-sofa", pose: "sit" }, DEFAULT_FURNITURE, 0.8);
    expect(p.pos[1]).toBeCloseTo(0.48 - 0.8);
  });
  it("same invite code always produces the same town", () => {
    expect(seededTown("abc123")).toEqual(seededTown("ABC123"));
  });
});
