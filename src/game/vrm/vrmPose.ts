// ポーズ → VRM正規化ボーン回転（React/three非依存の純粋計算）
import type { Pose, StudioFrame } from "../types";

export interface PoseAngles {
  rootY: number; rootRX: number;
  lt: number; rt: number; lk: number; rk: number;
  la: number; ra: number; laz: number; raz: number;
  hx: number; tz: number;
}

export function poseAngles(pose: Pose, t: number): PoseAngles {
  let rootY = 0, rootRX = 0;
  let lt = 0, rt = 0, lk = 0, rk = 0, la = 0, ra = 0, laz = 0.08, raz = -0.08, hx = 0, tz = 0;
  const breathe = Math.sin(t * 2) * 0.02;
  switch (pose) {
    case "walk": {
      const s = Math.sin(t * 8);
      lt = s * 0.55; rt = -s * 0.55; lk = Math.max(0, -s) * 0.6; rk = Math.max(0, s) * 0.6;
      la = -s * 0.5; ra = s * 0.5; rootY = Math.abs(Math.cos(t * 8)) * 0.03;
      break;
    }
    case "sit":
      lt = rt = -Math.PI / 2; lk = rk = Math.PI / 2; la = ra = -0.5; hx = 0.05 + breathe; break;
    case "knees":
      rootY = -0.68; lt = rt = -2.15; lk = rk = 2.55; la = ra = -1.1; hx = 0.16; break;
    case "sleep":
      rootRX = -Math.PI / 2; laz = 0.15; raz = -0.15; break;
    case "burn":
      rootY = Math.abs(Math.sin(t * 14)) * 0.12;
      la = ra = -2.7 + Math.sin(t * 30) * 0.25; laz = 0.4; raz = -0.4; hx = -0.2;
      lt = Math.sin(t * 14) * 0.3; rt = -lt; break;
    case "look":
      hx = 0.35; la = ra = -0.25; break;
    case "wave":
      ra = -2.8; raz = -0.3 + Math.sin(t * 9) * 0.45; hx = breathe; break;
    case "dance":
      rootY = Math.abs(Math.sin(t * 6)) * 0.08; tz = Math.sin(t * 6) * 0.15;
      la = -2.4 + Math.sin(t * 6) * 0.5; ra = -2.4 - Math.sin(t * 6) * 0.5;
      lt = Math.sin(t * 6) * 0.3; rt = -lt; break;
    default:
      hx = breathe; la = Math.sin(t * 1.5) * 0.04; ra = -la;
  }
  return { rootY, rootRX, lt, rt, lk, rk, la, ra, laz, raz, hx, tz };
}

/** Tポーズの腕を下ろすZ回転（左腕は+X側なので負方向） */
export const ARM_DROP = 1.25;

/** 身長・体重からVRMのスケール。naturalHeight はモデル本来の身長(m) */
export function vrmScale(heightCm: number, widthFactor: number, naturalHeight: number) {
  const y = heightCm / 100 / Math.max(0.1, naturalHeight);
  const w = 0.7 + widthFactor * 0.3;
  return { x: y * w, y, z: y * w };
}

export function sampleStudioMotion(frames: StudioFrame[], time: number): PoseAngles {
  if (!frames.length) return poseAngles("stand", time);
  const total = frames.reduce((s, f) => s + f.duration, 0);
  let t = ((time % total) + total) % total;
  let index = 0;
  while (index < frames.length - 1 && t >= (frames[index]?.duration ?? 1)) { t -= frames[index]?.duration ?? 1; index++; }
  const frame = frames[index];
  if (!frame) return poseAngles("stand", time);
  const prev = frames[(index + frames.length - 1) % frames.length] ?? frame;
  const a = poseAngles(prev.pose, time), b = poseAngles(frame.pose, time);
  b.rootRX += frame.bend; b.la += frame.arm; b.ra += frame.arm;
  a.rootRX += prev.bend; a.la += prev.arm; a.ra += prev.arm;
  const u = Math.min(1, t / Math.min(0.65, frame.duration));
  const smooth = u * u * (3 - 2 * u);
  return Object.fromEntries(Object.keys(a).map(key => [key, a[key as keyof PoseAngles] + (b[key as keyof PoseAngles] - a[key as keyof PoseAngles]) * smooth])) as unknown as PoseAngles;
}
