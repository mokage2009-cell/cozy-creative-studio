import { z } from "zod";
export const motionSchema = z.object({
  name: z.string().min(1).max(60),
  frames: z.array(z.object({
    pose: z.enum(["stand", "walk", "sit", "sleep", "burn", "look", "wave", "dance", "knees"]),
    duration: z.number().min(0.3).max(10),
    bend: z.number().min(-0.5).max(0.5),
    arm: z.number().min(-1).max(1),
  })).min(2).max(12),
});