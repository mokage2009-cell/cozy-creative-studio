// 仮想空間ゲームの共通データ構造（後で外部チャットアプリ・AI・スタジオ機能と接続するための受け皿）
export type FurnitureType = "bed" | "sofa" | "kitchen" | "plant" | "table" | "lamp" | "special";
export type Pose = "stand" | "walk" | "sit" | "sleep" | "burn" | "look" | "wave" | "dance" | "knees";

export interface FurnitureItem {
  uid: string;
  type: FurnitureType;
  name: string;
  /** AI特殊家具の能力（例: 溶けない） */
  ability?: string;
  color?: string;
  placed: boolean;
  x: number;
  z: number;
  rotY: number;
}

export type Gender = "male" | "female";
export type HairStyle = "short" | "long" | "ponytail" | "bob" | "spiky";
export type EyeStyle = "round" | "narrow" | "sleepy";
export type MouthStyle = "smile" | "neutral" | "open";

export interface AvatarConfig {
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  hair: HairStyle;
  eyes: EyeStyle;
  mouth: MouthStyle;
  skin: string;
  hairColor: string;
  outfit: string;
  /** 将来: 外部の人間型glbモデルURL。設定するとプロシージャルモデルの代わりに読み込む */
  modelUrl?: string | undefined;
  /** 将来: 服デザインID */
  clothingId?: string | undefined;
}

export type HouseStyle = "cottage" | "modern" | "tower" | "cafe";
export interface HouseDef {
  id: string;
  name: string;
  price: number;
  style: HouseStyle;
  wall: string;
  roof: string;
}

export interface AvatarCommand {
  targetUid?: string | undefined;
  targetPoint?: [number, number] | undefined;
  pose: Pose;
  say?: string | undefined;
}

/** 服デザイン（仮）: 後でAI生成テクスチャ等と接続 */
export interface ClothingDesign {
  id: string;
  name: string;
  prompt?: string;
  textureUrl?: string;
  createdAt: number;
}

/** モーション作成部屋（仮）: 後でモーションスタジオと接続 */
export interface MotionClip {
  id: string;
  name: string;
  durationSec: number;
  keyframes: { t: number; bone: string; rotation: [number, number, number] }[];
  createdAt: number;
}

export interface AvatarSlot { id: string; name: string; config: AvatarConfig }
export interface StudioFrame { pose: Pose; duration: number; bend: number; arm: number }
export interface StudioMotion { id: string; name: string; frames: StudioFrame[] }

export type EntryStatus = "none" | "pending" | "granted" | "denied";
export interface VisitState {
  code: string;
  ownerName: string;
  plots: (string | null)[];
  status: EntryStatus;
}
