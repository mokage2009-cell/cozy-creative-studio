import { Component, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Undo2, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "../store";
import { editSite } from "./siteEdit.functions";

type Msg = { who: "me" | "ai"; text: string };

export function SiteAiPanel({ onClose }: { onClose: () => void }) {
  const run = useServerFn(editSite);
  const s = useGame();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Msg[]>([]);
  const send = async () => {
    const message = text.trim();
    if (!message || busy) return;
    setText(""); setBusy(true);
    setLog((l) => [...l, { who: "me", text: message }]);
    try {
      const r = await run({ data: { message, current: { avatar: s.avatar, scene: s.sceneColors, hideHud: s.hideHud } } });
      if (r.edit) {
        s.applySiteEdit(r.edit);
        setLog((l) => [...l, { who: "ai", text: r.edit?.say || "変更しました" }]);
      } else setLog((l) => [...l, { who: "ai", text: r.error ?? "うまくいきませんでした" }]);
    } catch {
      setLog((l) => [...l, { who: "ai", text: "AIに接続できませんでした。" }]);
    } finally { setBusy(false); }
  };
  return (
    <div className="panel site-ai p-3" role="dialog" aria-label="サイト修正AI">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1 text-sm font-bold"><Sparkles size={15} />サイト修正AI</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" disabled={!s.siteBackups.length} onClick={() => { if (s.undoSiteEdit()) setLog((l) => [...l, { who: "ai", text: "1つ前の状態に戻しました" }]); }}><Undo2 />元に戻す</Button>
          <Button variant="ghost" size="icon" aria-label="閉じる" onClick={onClose}><X /></Button>
        </div>
      </div>
      <div className="mb-2 flex max-h-40 flex-col gap-1 overflow-y-auto text-xs">
        {log.length === 0 && <p className="text-muted-foreground">例：「部屋を夜っぽくして」「壁をミントグリーンに」「アバターを金髪ロングに」「表示を隠して鑑賞モードに」</p>}
        {log.map((m, i) => <div key={i} className={m.who === "me" ? "self-end rounded-2xl bg-primary px-3 py-1 text-primary-foreground" : "self-start rounded-2xl bg-secondary px-3 py-1"}>{m.text}</div>)}
        {busy && <div className="self-start rounded-2xl bg-secondary px-3 py-1">考え中…</div>}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <input className="field flex-1" aria-label="修正の指示" value={text} onChange={(e) => setText(e.target.value)} placeholder="サイトをどう変えたい？" />
        <Button size="icon" aria-label="送信" disabled={busy || !text.trim()}><Send /></Button>
      </form>
    </div>
  );
}

/** 画面が壊れたら直前のバックアップへ自動で戻して描き直す */
export class AutoRestore extends Component<{ children: ReactNode }, { failed: number }> {
  override state = { failed: 0 };
  static getDerivedStateFromError() { return null; }
  override componentDidCatch(e: unknown) {
    console.error("表示エラー。直前の状態に戻します", e);
    const g = useGame.getState();
    if (g.undoSiteEdit()) { g.notify("表示に問題が出たので、直前の状態に自動で戻しました"); this.setState((s) => ({ failed: s.failed + 1 })); }
  }
  override render() { return <div key={this.state.failed} className="contents">{this.props.children}</div>; }
}
