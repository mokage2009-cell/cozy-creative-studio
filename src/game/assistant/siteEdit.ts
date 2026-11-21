import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const SCENE_KEYS = ["wall", "trim", "wood", "sage", "rose", "sky", "light", "floor", "rug"] as const;

/** AIが返してよい変更だけを許可（サイトを壊さないための安全な枠） */
export const siteEditSchema = z.object({
  say: z.string().max(300),
  avatar: z.object({
    height: z.number().min(140).max(195),
    weight: z.number().min(35).max(110),
    gender: z.enum(["male", "female"]),
    hair: z.enum(["short", "long", "ponytail", "bob", "spiky"]),
    eyes: z.enum(["round", "narrow", "sleepy"]),
    mouth: z.enum(["smile", "neutral", "open"]),
    skin: hex, hairColor: hex, outfit: hex,
  }).partial().optional(),
  scene: z.object({ wall: hex, trim: hex, wood: hex, sage: hex, rose: hex, sky: hex, light: hex, floor: hex, rug: hex }).partial().optional(),
  ui: z.object({ hideHud: z.boolean() }).partial().optional(),
});
export type SiteEdit = z.infer<typeof siteEditSchema>;

/** 不正な値を含む返答は丸ごと捨てる */
export function sanitizeEdit(raw: unknown): SiteEdit | null {
  const r = siteEditSchema.safeParse(raw);
  return r.success ? r.data : null;
}
