import { Button } from "@/components/ui/button";
import { useRef, useState, type ReactNode } from "react";
import { CUSTOM_VRM_REF, imageToDataUrl, saveVrm } from "../vrm/vrmStorage";
import { HAIR_COLORS, OUTFIT_COLORS, SKIN_COLORS } from "../catalog";
import { useGame } from "../store";
import type { AvatarConfig } from "../types";

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="panel max-h-[52vh] overflow-y-auto p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold">{title}</h3>
        <Button variant="tool" className="btn btn-ghost btn-sm" onClick={onClose}>閉じる ✕</Button>
      </div>
      {children}
    </div>
  );
}

export function ChatPanel({ log, onSend, onClose }: { log: { who: "me" | "avatar"; text: string }[]; onSend: (t: string) => void; onClose: () => void }) {
  const [t, setT] = useState("");
  return (
    <Sheet title="簡易チャットで指示" onClose={onClose}>
      <div className="mb-2 flex max-h-32 flex-col gap-1 overflow-y-auto text-xs">
        {log.length === 0 && <p className="text-muted-foreground">例：「ソファに座って『疲れた〜』と言って」「ベッドで寝て」「窓まで歩いて」「踊って」</p>}
        {log.map((m, i) => (
          <div key={i} className={m.who === "me" ? "self-end rounded-2xl bg-primary px-3 py-1 text-primary-foreground" : "self-start rounded-2xl bg-secondary px-3 py-1"}>{m.text}</div>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (t.trim()) { onSend(t.trim()); setT(""); } }}>
        <input className="field flex-1" value={t} onChange={(e) => setT(e.target.value)} placeholder="アバターへの指示を入力" />
        <Button variant="tool" className="btn btn-primary">送信</Button>
      </form>
    </Sheet>
  );
}

function Choice<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([v, l]) => (
        <Button variant="tool" key={v} className={`btn btn-sm ${value === v ? "btn-primary" : ""}`} onClick={() => onChange(v)}>{l}</Button>
      ))}
    </div>
  );
}
function Swatches({ value, colors, onChange }: { value: string; colors: string[]; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5">
      {colors.map((c) => (
        <Button variant="tool" key={c} aria-label={c} onClick={() => onChange(c)} className={`h-7 w-7 rounded-full border-2 ${value === c ? "border-foreground" : "border-card"}`} style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

export function AvatarPanel({ onClose }: { onClose: () => void }) {
  const a = useGame((s) => s.avatar);
  const up = useGame((s) => s.updateAvatar);
  const row = (label: string, el: ReactNode) => (
    <div className="mb-2"><div className="mb-1 text-xs font-bold text-muted-foreground">{label}</div>{el}</div>
  );
  return (
    <Sheet title="アバター設定" onClose={onClose}>
      {row(`身長 ${a.height}cm`, <input type="range" min={140} max={195} value={a.height} onChange={(e) => up({ height: +e.target.value })} className="w-full accent-primary" />)}
      {row(`体重 ${a.weight}kg`, <input type="range" min={35} max={110} value={a.weight} onChange={(e) => up({ weight: +e.target.value })} className="w-full accent-primary" />)}
      <VrmPicker />
      {row("服の色", <Swatches value={a.outfit} colors={OUTFIT_COLORS} onChange={(c) => up({ outfit: c })} />)}
      <div className="mb-2 text-xs">
        <div className="mt-2">
      {row("性別", <Choice value={a.gender} onChange={(v) => up({ gender: v })} options={[["female", "女性"], ["male", "男性"]]} />)}
      {row("髪型", <Choice<AvatarConfig["hair"]> value={a.hair} onChange={(v) => up({ hair: v })} options={[["short", "ショート"], ["long", "ロング"], ["ponytail", "ポニーテール"], ["bob", "ボブ"], ["spiky", "ツンツン"]]} />)}
      {row("目", <Choice<AvatarConfig["eyes"]> value={a.eyes} onChange={(v) => up({ eyes: v })} options={[["round", "まんまる"], ["narrow", "キリッと"], ["sleepy", "ねむそう"]]} />)}
      {row("口", <Choice<AvatarConfig["mouth"]> value={a.mouth} onChange={(v) => up({ mouth: v })} options={[["smile", "にっこり"], ["neutral", "ふつう"], ["open", "ぽかん"]]} />)}
      {row("肌の色", <Swatches value={a.skin} colors={SKIN_COLORS} onChange={(c) => up({ skin: c })} />)}
      {row("髪の色", <Swatches value={a.hairColor} colors={HAIR_COLORS} onChange={(c) => up({ hairColor: c })} />)}
        </div>
      </div>
    </Sheet>
  );
}

function VrmPicker() {
  const a = useGame((s) => s.avatar);
  const up = useGame((s) => s.updateAvatar);
  const notify = useGame((s) => s.notify);
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (!/\.vrm$/i.test(f.name)) return notify(".vrm ファイルを選んでください");
    setBusy(true);
    try {
      const key = crypto.randomUUID();
      await saveVrm(f, key);
      // 参照を一度切り替えて再読み込みさせる
      up({ modelUrl: `idb:${key}` });
      notify(`「${f.name}」を読み込みました`);
    } catch {
      notify("VRMの保存に失敗しました");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <input ref={ref} type="file" accept=".vrm" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <Button variant="tool" className="btn btn-primary btn-sm" disabled={busy} onClick={() => ref.current?.click()}>{busy ? "読み込み中…" : "VRMモデルを読み込む"}</Button>
      {a.modelUrl && <Button variant="tool" className="btn btn-sm" onClick={() => up({ modelUrl: undefined })}>初期モデルに戻す</Button>}
      <span className="text-xs text-muted-foreground">{a.modelUrl ? "自作VRMを使用中" : "初期VRMを使用中"}</span>
    </div>
  );
}

export function InventoryPanel({ selected, onSelect, onClose }: { selected: string | null; onSelect: (u: string | null) => void; onClose: () => void }) {
  const s = useGame();
  const sel = s.furniture.find((f) => f.uid === selected && f.placed);
  return (
    <Sheet title="家具の配置・入れ替え" onClose={onClose}>
      <p className="mb-2 text-xs text-muted-foreground">家具をタップして選択 → 床をタップで移動。</p>
      {sel && (
        <div className="mb-2 flex items-center gap-2">
          <span className="chip bg-secondary">選択中：{sel.name}</span>
          <Button variant="tool" className="btn btn-sm" onClick={() => s.rotateItem(sel.uid)}>⟳ 回転</Button>
          <Button variant="tool" className="btn btn-sm" onClick={() => { s.storeItem(sel.uid); onSelect(null); }}>しまう</Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {s.furniture.map((f) => (
          <div key={f.uid} className="flex items-center justify-between gap-1 rounded-xl bg-secondary px-2 py-1 text-xs">
            <span className="truncate font-bold">{f.name}{f.ability ? `（${f.ability}）` : ""}</span>
            {f.placed ? (
              <Button variant="tool" className="btn btn-sm btn-ghost" onClick={() => onSelect(f.uid)}>選択</Button>
            ) : (
              <Button variant="tool" className="btn btn-sm btn-primary" onClick={() => { s.placeItem(f.uid); onSelect(f.uid); }}>置く</Button>
            )}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

function ClothPanel({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const ref = useRef<HTMLInputElement>(null);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const url = await imageToDataUrl(f);
      s.addClothing(f.name.replace(/\.[^.]+$/, ""), url);
      s.notify("服のテクスチャを着せました");
    } catch {
      s.notify("画像を読み込めませんでした");
    }
    if (ref.current) ref.current.value = "";
  };
  return (
    <Sheet title="服デザイン" onClose={onClose}>
      <p className="mb-2 text-xs text-muted-foreground">自作の服テクスチャ画像（VRoidの服テクスチャ等）を選ぶと、VRMの服部分に反映されます。</p>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="mb-2 flex gap-2">
        <Button variant="tool" className="btn btn-sm btn-primary" onClick={() => ref.current?.click()}>服テクスチャを読み込む</Button>
        {s.avatar.clothingId && <Button variant="tool" className="btn btn-sm" onClick={() => s.updateAvatar({ clothingId: undefined })}>元の服に戻す</Button>}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {s.clothing.filter((c) => c.textureUrl).map((c) => (
          <div key={c.id} className={`rounded-xl border-2 p-1 text-xs ${s.avatar.clothingId === c.id ? "border-primary" : "border-transparent"}`}>
            <Button variant="tool" className="block w-full" onClick={() => s.updateAvatar({ clothingId: c.id })}>
              <img src={c.textureUrl} alt={c.name} className="aspect-square w-full rounded-lg object-cover" />
              <span className="block truncate">{c.name}</span>
            </Button>
            <Button variant="tool" className="btn btn-ghost btn-sm w-full" onClick={() => s.removeClothing(c.id)}>削除</Button>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

export function StubPanel({ kind, onClose }: { kind: "cloth" | "motion"; onClose: () => void }) {
  const s = useGame();
  if (kind === "cloth") return <ClothPanel onClose={onClose} />;
  const cloth = (kind as string) === "cloth";
  const list = cloth ? s.clothing : s.motions;
  return (
    <Sheet title={cloth ? "服デザイン（仮）" : "モーション作成部屋（仮）"} onClose={onClose}>
      <p className="mb-2 text-xs text-muted-foreground">
        {cloth ? "今後、AIで服のデザインを生成してアバターに着せる機能を接続予定です。" : "今後、オリジナルのモーションを作成・保存するスタジオ機能を接続予定です。"}
      </p>
      <Button variant="tool" className="btn btn-sm btn-primary mb-2" onClick={cloth ? s.addClothingStub : s.addMotionStub}>テストデータを保存</Button>
      <ul className="text-xs">{list.map((x) => <li key={x.id}>・{x.name}</li>)}</ul>
    </Sheet>
  );
}
