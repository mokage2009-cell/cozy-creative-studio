// ゲームのルール（React / three.js 非依存）
import { INTERACT } from "./catalog";
import { HOUSES, PLOT_COUNT } from "./catalog";
import type { AvatarCommand, AvatarConfig, FurnitureItem, FurnitureType, Pose } from "./types";

export const PLANT_GROWTH_PER_HOUR = 0.25;
export const PLANT_MAX_SCALE = 3;

/** 経過時間から植物の新しい大きさを計算 */
export function plantGrowth(prevScale: number, elapsedMs: number): number {
  const hours = Math.max(0, elapsedMs) / 3_600_000;
  return Math.min(PLANT_MAX_SCALE, prevScale + hours * PLANT_GROWTH_PER_HOUR);
}

export function formatElapsed(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}日${h}時間`;
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

/** アバターの体格（m単位） */
export function avatarDims(c: AvatarConfig) {
  const H = c.height / 100;
  const bmi = c.weight / (H * H);
  const width = Math.min(1.5, Math.max(0.75, bmi / 21));
  return {
    H,
    width,
    legLen: H * 0.47,
    thigh: H * 0.24,
    shin: H * 0.23,
    torso: H * 0.3,
    headR: H * 0.066,
  };
}

export function toWorld(item: FurnitureItem, [lx, lz]: [number, number]): [number, number] {
  const c = Math.cos(item.rotY);
  const s = Math.sin(item.rotY);
  return [item.x + lx * c + lz * s, item.z - lx * s + lz * c];
}

export interface MovePlan {
  approach: [number, number];
  pos: [number, number, number];
  rotY: number;
  pose: Pose;
  say?: string | undefined;
}

export function planCommand(cmd: AvatarCommand, items: FurnitureItem[], legLen: number): MovePlan {
  const item = cmd.targetUid ? items.find((i) => i.uid === cmd.targetUid && i.placed) : undefined;
  if (!item) {
    const [x, z] = cmd.targetPoint ?? [0, 0];
    const pose = cmd.pose === "sit" || cmd.pose === "sleep" ? "stand" : cmd.pose;
    return { approach: [x, z], pos: [x, 0, z], rotY: 0, pose, say: cmd.say };
  }
  const spec = INTERACT[item.type];
  const ap = toWorld(item, spec.approach);
  let pos: [number, number, number] = [ap[0], 0, ap[1]];
  let rotY = item.rotY + spec.face;
  let pose = cmd.pose;
  if (pose === "sit" && spec.seat) {
    const w = toWorld(item, [spec.seat.x, spec.seat.z]);
    pos = [w[0], spec.seat.y - legLen, w[1]];
    rotY = item.rotY + spec.seat.rotY;
  } else if (pose === "sleep" && spec.lie) {
    const w = toWorld(item, [spec.lie.x, spec.lie.z]);
    pos = [w[0], spec.lie.y, w[1]];
    rotY = item.rotY + spec.lie.rotY;
  } else if (pose === "sit" || pose === "sleep") {
    pose = "stand";
  }
  return { approach: ap, pos, rotY, pose, say: cmd.say };
}

export function defaultLine(pose: Pose, item?: FurnitureItem): string {
  if (item?.type === "special") return `${item.name}…能力は「${item.ability ?? "？"}」だって！`;
  switch (pose) {
    case "sit":
      return "ふぅ、ひと休み。";
    case "sleep":
      return "おやすみなさい…zzz";
    case "burn":
      return "あちちっ！！ヤカン熱すぎ…！";
    case "wave":
      return "やっほー！";
    case "dance":
      return "♪ るんるん〜";
    case "look":
      return item ? `${item.name}、いい感じ。` : "ふむふむ…";
    default:
      return "了解！";
  }
}

const TYPE_WORDS: [RegExp, FurnitureType][] = [
  [/ベッド|布団|ふとん/, "bed"],
  [/ソファ/, "sofa"],
  [/キッチン|ヤカン|やかん|台所/, "kitchen"],
  [/植物|観葉|プラント|鉢/, "plant"],
  [/テーブル|机/, "table"],
  [/ランプ|照明|ライト/, "lamp"],
];

/** 簡易チャットのテキストからアバター命令を作る */
export function parseChat(text: string, items: FurnitureItem[], defaultUid?: string): AvatarCommand {
  const placed = items.filter((i) => i.placed);
  let target = placed.find((i) => i.type === "special" && text.includes(i.name));
  if (!target) {
    for (const [re, type] of TYPE_WORDS) {
      if (re.test(text)) {
        target = placed.find((i) => i.type === type);
        if (target) break;
      }
    }
  }
  let targetPoint: [number, number] | undefined;
  if (!target) {
    if (/中央|真ん中|まんなか/.test(text)) targetPoint = [0, 0];
    else if (/窓/.test(text)) targetPoint = [-2.5, -3.6];
    else if (/ドア|入口|玄関/.test(text)) targetPoint = [4, 3.5];
    else if (defaultUid) target = placed.find((i) => i.uid === defaultUid);
  }

  let pose: Pose = "stand";
  if (/寝|ねる|眠/.test(text)) pose = "sleep";
  else if (/座|すわ/.test(text)) pose = "sit";
  else if (/触|さわ/.test(text)) pose = target?.type === "kitchen" ? "burn" : "look";
  else if (/手を振|挨拶|あいさつ|こんにちは|やあ/.test(text)) pose = "wave";
  else if (/踊|おど|ダンス/.test(text)) pose = "dance";
  else if (/見|様子|調べ/.test(text) || target) pose = "look";

  const quoted = text.match(/[「『"](.+?)[」』"]/);
  const say = quoted ? quoted[1] : defaultLine(pose, target);
  return { targetUid: target?.uid, targetPoint, pose, say };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const OWNER_NAMES = ["ユイ", "ケンタ", "サクラ", "レン", "アオイ", "ヒナタ", "コウ", "ミオ"];

/** 招待コードから他人の街を決定的に生成（後でサーバー取得に差し替え） */
export function seededTown(code: string) {
  const h = hash(code.toUpperCase());
  const plots: (string | null)[] = [];
  for (let i = 0; i < PLOT_COUNT; i++) {
    const v = (h >> (i * 3)) & 7;
    plots.push(i === 0 || v < 6 ? HOUSES[v % HOUSES.length]?.id ?? null : null);
  }
  return { ownerName: OWNER_NAMES[h % OWNER_NAMES.length] ?? "ユイ", plots };
}

export function makeInviteCode(rand: () => number = Math.random): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(rand() * chars.length)];
  return s;
}

export type HomeZone = "living" | "hallway" | "studio";
export const STUDIO_POINT: [number, number] = [0, -10.5];
export const WALK_SPEED = 2.8;
export function homeZone(z: number): HomeZone { return z < -8 ? "studio" : z < -5 ? "hallway" : "living"; }
export function studioEditingAllowed(z: number, readOnly: boolean) { return !readOnly && homeZone(z) === "studio"; }
export function homePath(from: [number, number], to: [number, number]): [number, number][] {
  if ((from[1] < -5) === (to[1] < -5)) return [to];
  return from[1] >= -5 ? [[0, -3.5], [0, -5.5], [0, -8.5], to] : [[0, -8.5], [0, -5.5], [0, -3.5], to];
}
export function walkStep(position: [number, number], target: [number, number], dt: number): [number, number] {
  const dx = target[0] - position[0], dz = target[1] - position[1], distance = Math.hypot(dx, dz);
  const step = Math.min(distance, WALK_SPEED * dt);
  return distance < 0.001 ? target : [position[0] + dx / distance * step, position[1] + dz / distance * step];
}
