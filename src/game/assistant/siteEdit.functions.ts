import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sanitizeEdit, SCENE_KEYS, type SiteEdit } from "./siteEdit";

const input = z.object({ message: z.string().min(1).max(500), current: z.record(z.string(), z.unknown()) });

export const editSite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }): Promise<{ edit: SiteEdit | null; error: string | null }> => {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) return { edit: null, error: "AIキーが設定されていません。" };
    const prompt = `あなたは3Dの家ゲームサイトを修正するAIです。ユーザーの指示に従い、変更内容をJSONだけで返してください。
形式: {"say":"日本語の短い返事","avatar":{...},"scene":{...},"ui":{"hideHud":bool}}
avatar のキー: height(140-195), weight(35-110), gender(male|female), hair(short|long|ponytail|bob|spiky), eyes(round|narrow|sleepy), mouth(smile|neutral|open), skin/hairColor/outfit(#rrggbb)。
scene のキー(部屋の色 #rrggbb): ${SCENE_KEYS.join(", ")}（wall=壁, floor=背景, wood=フローリング, rug=ラグ, light=光の色, sky=窓の外, sage/rose=アクセント, trim=枠）。夜にする等は暗めの色で表現。
ui.hideHud=true で画面の飾り表示を隠す鑑賞モード。
変更するキーだけ入れる。できない指示なら say で理由を伝え他は省略。
現在の状態: ${JSON.stringify(data.current)}
指示: ${data.message}`;
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.4 } }),
      });
      if (!res.ok) {
        console.error("Gemini error", res.status, await res.text());
        return { edit: null, error: res.status === 429 ? "AIの利用上限に達しました。少し待ってから試してください。" : `AIに接続できませんでした（${res.status}）。` };
      }
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const edit = sanitizeEdit(JSON.parse(text));
      return edit ? { edit, error: null } : { edit: null, error: "AIの返答を理解できませんでした。言い方を変えてみてください。" };
    } catch (e) {
      console.error(e);
      return { edit: null, error: "AIの返答を読み取れませんでした。" };
    }
  });
