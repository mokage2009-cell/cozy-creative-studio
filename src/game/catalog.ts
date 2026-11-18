import type { AvatarConfig, FurnitureItem, FurnitureType, HouseDef, Pose } from "./types";

export const START_POINTS = 1000;
export const PLOT_COUNT = 4; // plot 0 = 自宅

export const HOUSES: HouseDef[] = [
  { id: "cottage", name: "コテージ", price: 0, style: "cottage", wall: "#fff1dc", roof: "#e8735a" },
  { id: "modern", name: "モダンハウス", price: 500, style: "modern", wall: "#f4f6fa", roof: "#3b4a63" },
  { id: "tower", name: "とんがり塔", price: 800, style: "tower", wall: "#e5efe2", roof: "#5b8fd6" },
  { id: "cafe", name: "カフェ", price: 600, style: "cafe", wall: "#fde4ea", roof: "#3fa39a" },
];

export const FURNITURE_CATALOG: { type: FurnitureType; name: string; price: number }[] = [
  { type: "bed", name: "ベッド", price: 300 },
  { type: "sofa", name: "ソファ", price: 250 },
  { type: "kitchen", name: "キッチン（ヤカン付き）", price: 400 },
  { type: "plant", name: "観葉植物", price: 120 },
  { type: "table", name: "ローテーブル", price: 150 },
  { type: "lamp", name: "フロアランプ", price: 80 },
];

export const DEFAULT_FURNITURE: FurnitureItem[] = [
  { uid: "f-bed", type: "bed", name: "ベッド", placed: true, x: -4, z: -2.6, rotY: 0 },
  { uid: "f-sofa", type: "sofa", name: "ソファ", placed: true, x: 1, z: 1.5, rotY: 0 },
  { uid: "f-kitchen", type: "kitchen", name: "キッチン（ヤカン付き）", placed: true, x: 2.5, z: -4.2, rotY: 0 },
  { uid: "f-plant", type: "plant", name: "観葉植物", placed: true, x: -1.2, z: -4.2, rotY: 0 },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  height: 165,
  weight: 55,
  gender: "female",
  hair: "long",
  eyes: "round",
  mouth: "smile",
  skin: "#f6d2b8",
  hairColor: "#4a2f25",
  outfit: "#e8735a",
};

export const SKIN_COLORS = ["#fbe3d2", "#f6d2b8", "#e3b18f", "#c68863", "#8d5a3b"];
export const HAIR_COLORS = ["#1f1a1a", "#4a2f25", "#a0663c", "#e8c47a", "#d9a2b8", "#6f86c9"];
export const OUTFIT_COLORS = ["#e8735a", "#3fa39a", "#5b8fd6", "#f2c14e", "#7f6bb8", "#3b4a63"];

export const ACTIONS: Record<FurnitureType, { id: string; label: string; pose: Pose }[]> = {
  bed: [
    { id: "sit", label: "座る", pose: "sit" },
    { id: "sleep", label: "寝る", pose: "sleep" },
  ],
  sofa: [{ id: "sit", label: "座る", pose: "sit" }],
  kitchen: [{ id: "touch", label: "触ってみる", pose: "burn" }],
  plant: [{ id: "check", label: "様子を見る", pose: "look" }],
  table: [{ id: "look", label: "眺める", pose: "look" }],
  lamp: [{ id: "look", label: "眺める", pose: "look" }],
  special: [{ id: "inspect", label: "調べる", pose: "look" }],
};

/** 家具ローカル座標でのインタラクション位置（+zが正面） */
export interface InteractSpec {
  approach: [number, number];
  face: number;
  seat?: { x: number; y: number; z: number; rotY: number };
  lie?: { x: number; y: number; z: number; rotY: number };
}
export const INTERACT: Record<FurnitureType, InteractSpec> = {
  bed: {
    approach: [1.4, 0.2],
    face: -Math.PI / 2,
    seat: { x: 0.55, y: 0.55, z: 0.2, rotY: Math.PI / 2 },
    lie: { x: 0, y: 0.68, z: 0.85, rotY: 0 },
  },
  sofa: { approach: [0, 1.2], face: Math.PI, seat: { x: 0, y: 0.48, z: 0.05, rotY: 0 } },
  kitchen: { approach: [0.5, 1.0], face: Math.PI },
  plant: { approach: [0, 1.0], face: Math.PI },
  table: { approach: [0, 1.1], face: Math.PI },
  lamp: { approach: [0, 0.9], face: Math.PI },
  special: { approach: [0, 1.1], face: Math.PI },
};

export const SPECIAL_POOL = [
  { name: "氷", ability: "溶けない", color: "#bfe9ff" },
  { name: "炎の石", ability: "ずっと温かい", color: "#ff8a5c" },
  { name: "雲のクッション", ability: "ふわふわ浮かぶ", color: "#f3f6ff" },
  { name: "星のランタン", ability: "天井に星空を映す", color: "#ffe27a" },
];

export const NPC_NAMES = ["ミナ", "ソラ", "ハル", "リク"];
