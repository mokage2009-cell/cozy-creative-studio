import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_AVATAR, DEFAULT_FURNITURE, FURNITURE_CATALOG, HOUSES, PLOT_COUNT, SPECIAL_POOL, START_POINTS } from "./catalog";
import { formatElapsed, makeInviteCode, plantGrowth, seededTown } from "./logic";
import type { AvatarConfig, AvatarSlot, StudioMotion, ClothingDesign, FurnitureItem, FurnitureType, MotionClip, VisitState } from "./types";

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

interface GameState {
  username: string;
  points: number;
  inviteCode: string;
  ownedHouses: string[];
  plots: (string | null)[];
  furniture: FurnitureItem[];
  avatar: AvatarConfig;
  plant: { scale: number; lastCheckedAt: number };
  lastClosedAt: number;
  clothing: ClothingDesign[];
  motions: MotionClip[];
  avatarSlots: AvatarSlot[];
  studioMotions: StudioMotion[];
  liveTexture: string | null;
  sceneColors: Record<string, string>;
  hideHud: boolean;
  siteBackups: { avatar: AvatarConfig; sceneColors: Record<string, string>; hideHud: boolean }[];
  applySiteEdit: (e: { avatar?: { [K in keyof AvatarConfig]?: AvatarConfig[K] | undefined } | undefined; scene?: Record<string, string | undefined> | undefined; ui?: { hideHud?: boolean | undefined } | undefined }) => void;
  undoSiteEdit: () => boolean;
  saveAvatarSlot: (index: number) => void;
  loadAvatarSlot: (index: number) => void;
  saveStudioMotion: (motion: StudioMotion) => void;
  // セッション（保存しない）
  view: "town" | "home";
  visiting: VisitState | null;
  toast: { msg: string; at: number } | null;

  notify: (msg: string) => void;
  ensureInit: () => void;
  setUsername: (v: string) => void;
  setInviteCode: (v: string) => void;
  visit: (code: string) => void;
  returnHome: () => void;
  requestEntry: () => void;
  simulateEntry: (ok: boolean) => void;
  enterHome: () => void;
  exitHome: () => void;
  buyHouse: (id: string) => void;
  setPlot: (i: number, id: string | null) => void;
  buyFurniture: (type: FurnitureType) => void;
  placeItem: (uid: string) => void;
  storeItem: (uid: string) => void;
  moveItem: (uid: string, x: number, z: number) => void;
  rotateItem: (uid: string) => void;
  updateAvatar: (p: Partial<AvatarConfig>) => void;
  checkPlant: () => string;
  markClosed: () => void;
  debugAdvance: (hours: number) => void;
  generateSpecial: () => void;
  addClothingStub: () => void;
  addClothing: (name: string, textureUrl: string) => void;
  removeClothing: (id: string) => void;
  addMotionStub: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      username: "あなた",
      points: START_POINTS,
      inviteCode: "",
      ownedHouses: ["cottage"],
      plots: ["cottage", null, null, null].slice(0, PLOT_COUNT),
      furniture: DEFAULT_FURNITURE,
      avatar: DEFAULT_AVATAR,
      plant: { scale: 1, lastCheckedAt: 0 },
      lastClosedAt: 0,
      clothing: [],
      motions: [],
      avatarSlots: [],
      studioMotions: [],
      liveTexture: null,
      sceneColors: {},
      hideHud: false,
      siteBackups: [],
      applySiteEdit: (e) => {
        const g = get();
        const backup = { avatar: { ...g.avatar }, sceneColors: { ...g.sceneColors }, hideHud: g.hideHud };
        const scene: Record<string, string> = { ...g.sceneColors };
        for (const [k, v] of Object.entries(e.scene ?? {})) if (v) scene[k] = v;
        set({
          siteBackups: [...g.siteBackups, backup].slice(-10),
          avatar: { ...g.avatar, ...Object.fromEntries(Object.entries(e.avatar ?? {}).filter(([, v]) => v !== undefined)) } as AvatarConfig,
          sceneColors: scene,
          hideHud: e.ui?.hideHud ?? g.hideHud,
        });
      },
      undoSiteEdit: () => {
        const list = [...get().siteBackups];
        const last = list.pop();
        if (!last) return false;
        set({ ...last, siteBackups: list });
        return true;
      },
      saveAvatarSlot: (index) => {
        const slots = [...get().avatarSlots];
        slots[index] = { id: String(index), name: `スロット ${index + 1}`, config: { ...get().avatar } };
        set({ avatarSlots: slots });
        get().notify(`スロット ${index + 1}に保存しました`);
      },
      loadAvatarSlot: (index) => { const slot = get().avatarSlots[index]; if (slot) set({ avatar: { ...slot.config } }); },
      saveStudioMotion: (motion) => set({ studioMotions: [...get().studioMotions.filter(m => m.id !== motion.id), motion] }),
      view: "home",
      visiting: null,
      toast: null,

      notify: (msg) => set({ toast: { msg, at: Date.now() } }),
      ensureInit: () => {
        const s = get();
        const now = Date.now();
        const patch: Partial<GameState> = {};
        if (!s.inviteCode) patch.inviteCode = makeInviteCode();
        if (!s.plant.lastCheckedAt) patch.plant = { ...s.plant, lastCheckedAt: now };
        if (!s.lastClosedAt) patch.lastClosedAt = now;
        if (Object.keys(patch).length) set(patch);
      },
      setUsername: (v) => set({ username: v.slice(0, 16) }),
      setInviteCode: (v) => set({ inviteCode: v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) }),
      visit: (raw) => {
        const code = raw.trim().toUpperCase();
        if (!code) return;
        if (code === get().inviteCode) return get().notify("それはあなたの街のコードです");
        const t = seededTown(code);
        set({ visiting: { code, ownerName: t.ownerName, plots: t.plots, status: "none" }, view: "town" });
        get().notify(`${t.ownerName}さんの街に来ました`);
      },
      returnHome: () => set({ visiting: null, view: "town" }),
      requestEntry: () => {
        const v = get().visiting;
        if (v) set({ visiting: { ...v, status: "pending" } });
      },
      simulateEntry: (ok) => {
        const v = get().visiting;
        if (v) set({ visiting: { ...v, status: ok ? "granted" : "denied" } });
      },
      enterHome: () => {
        const v = get().visiting;
        if (v && v.status !== "granted") return;
        set({ view: "home" });
      },
      exitHome: () => set({ view: "town" }),
      buyHouse: (id) => {
        const s = get();
        const h = HOUSES.find((x) => x.id === id);
        if (!h || s.ownedHouses.includes(id)) return;
        if (s.points < h.price) return s.notify("ポイントが足りません");
        set({ points: s.points - h.price, ownedHouses: [...s.ownedHouses, id] });
        s.notify(`${h.name}を購入しました`);
      },
      setPlot: (i, id) => {
        if (i === 0 && !id) return;
        const plots = [...get().plots];
        plots[i] = id;
        set({ plots });
      },
      buyFurniture: (type) => {
        const s = get();
        const c = FURNITURE_CATALOG.find((x) => x.type === type);
        if (!c) return;
        if (s.points < c.price) return s.notify("ポイントが足りません");
        const item: FurnitureItem = { uid: uid(), type, name: c.name, placed: false, x: 0, z: 0, rotY: 0 };
        set({ points: s.points - c.price, furniture: [...s.furniture, item] });
        s.notify(`${c.name}を持ち物に追加しました`);
      },
      placeItem: (u) => set({ furniture: get().furniture.map((f) => (f.uid === u ? { ...f, placed: true, x: 0, z: 0 } : f)) }),
      storeItem: (u) => set({ furniture: get().furniture.map((f) => (f.uid === u ? { ...f, placed: false } : f)) }),
      moveItem: (u, x, z) =>
        set({
          furniture: get().furniture.map((f) =>
            f.uid === u ? { ...f, x: Math.max(-5.2, Math.min(5.2, x)), z: Math.max(-4.3, Math.min(4.3, z)) } : f,
          ),
        }),
      rotateItem: (u) => set({ furniture: get().furniture.map((f) => (f.uid === u ? { ...f, rotY: f.rotY + Math.PI / 2 } : f)) }),
      updateAvatar: (p) => set({ avatar: { ...get().avatar, ...p } }),
      checkPlant: () => {
        const s = get();
        const now = Date.now();
        const scale = plantGrowth(s.plant.scale, now - s.plant.lastCheckedAt);
        const grew = scale - s.plant.scale;
        set({ plant: { scale, lastCheckedAt: now } });
        const since = formatElapsed(now - s.lastClosedAt);
        return grew > 0.05
          ? `前回閉じてから${since}…こんなに大きく育ってる！（${scale.toFixed(1)}倍）`
          : `前回閉じてから${since}。まだ小さいな、また後で見よう。（${scale.toFixed(1)}倍）`;
      },
      markClosed: () => set({ lastClosedAt: Date.now() }),
      debugAdvance: (hours) => {
        const s = get();
        const ms = hours * 3_600_000;
        set({ lastClosedAt: s.lastClosedAt - ms, plant: { ...s.plant, lastCheckedAt: s.plant.lastCheckedAt - ms } });
        s.notify(`テスト：${hours}時間経過させました`);
      },
      generateSpecial: () => {
        const s = get();
        const p = SPECIAL_POOL[Math.floor(Math.random() * SPECIAL_POOL.length)];
        if (!p) return;
        const item: FurnitureItem = { uid: uid(), type: "special", name: p.name, ability: p.ability, color: p.color, placed: false, x: 0, z: 0, rotY: 0 };
        set({ furniture: [...s.furniture, item] });
        s.notify(`名前：${p.name}／能力：${p.ability} を持ち物に追加しました`);
      },
      addClothingStub: () => {
        const c: ClothingDesign = { id: uid(), name: `テスト服 ${get().clothing.length + 1}`, prompt: "（AIプロンプト未接続）", createdAt: Date.now() };
        set({ clothing: [...get().clothing, c] });
      },
      addClothing: (name, textureUrl) => {
        const c: ClothingDesign = { id: uid(), name, textureUrl, createdAt: Date.now() };
        set({ clothing: [...get().clothing, c], avatar: { ...get().avatar, clothingId: c.id } });
      },
      removeClothing: (id) => {
        const a = get().avatar;
        set({ clothing: get().clothing.filter((c) => c.id !== id), avatar: a.clothingId === id ? { ...a, clothingId: undefined } : a });
      },
      addMotionStub: () => {
        const m: MotionClip = { id: uid(), name: `テストモーション ${get().motions.length + 1}`, durationSec: 2, keyframes: [], createdAt: Date.now() };
        set({ motions: [...get().motions, m] });
      },
    }),
    {
      name: "vw-game-v1",
      partialize: ({ view, visiting, toast, liveTexture, ...rest }) => {
        void view; void visiting; void toast; void liveTexture;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")) as Partial<GameState>;
      },
    },
  ),
);
