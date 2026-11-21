import { describe, it, expect, beforeEach } from "vitest";
import { sanitizeEdit } from "./siteEdit";
import { useGame } from "../store";

describe("site edit AI", () => {
  beforeEach(() => useGame.setState({ siteBackups: [], sceneColors: {}, hideHud: false }));
  it("rejects values outside the safe range", () => {
    expect(sanitizeEdit({ say: "x", avatar: { height: 300 } })).toBeNull();
    expect(sanitizeEdit({ say: "x", scene: { wall: "red" } })).toBeNull();
  });
  it("backs up before applying and undo restores it", () => {
    const before = useGame.getState().avatar.hairColor;
    useGame.getState().applySiteEdit({ avatar: { hairColor: "#e8c47a" }, scene: { wall: "#223344" } });
    expect(useGame.getState().avatar.hairColor).toBe("#e8c47a");
    expect(useGame.getState().sceneColors["wall"]).toBe("#223344");
    expect(useGame.getState().undoSiteEdit()).toBe(true);
    expect(useGame.getState().avatar.hairColor).toBe(before);
    expect(useGame.getState().sceneColors["wall"]).toBeUndefined();
  });
});
