import { createServerFn } from "@tanstack/react-start";
import { generateResponse } from "@lovable.dev/ai-gateway";
import { z } from "zod";
import { motionSchema } from "./motionSchema";

export const assistMotion = createServerFn({ method: "POST" })
  .inputValidator(z.object({ prompt: z.string().trim().min(2).max(300) }))
  .handler(async ({ data }) => {
    try {
      const response = await generateResponse({
        model: "openai/gpt-6.1-terra",
        input: `Return JSON only. Design a smooth looping anime avatar motion for: ${data.prompt}. Shape: {"name":"Japanese name","frames":[{"pose":"stand","duration":1,"bend":0,"arm":0}]}. Use 2-12 frames, pose only stand, walk, sit, sleep, burn, look, wave, dance, knees (体育座り). Duration 0.3-10 seconds, bend -0.5 to 0.5 radians, arm -1 to 1 radians. Include transition poses.`,
        text: { format: { type: "json_object" } },
      });
      const text = response.output?.flatMap(item => item.type === "message" ? item.content.flatMap(c => c.type === "output_text" ? [c.text] : []) : []).join("") ?? "";
      return { motion: motionSchema.parse(JSON.parse(text)), error: null };
    } catch (error) {
      console.error("Motion assistance failed", error);
      return { motion: null, error: "AI補助を利用できませんでした。入力はそのまま残っています。" };
    }
  });