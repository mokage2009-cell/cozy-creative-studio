import { useEffect, useState } from "react";
import { FURNITURE_CATALOG, HOUSES } from "./catalog";
import { HomeView } from "./home/HomeView";
import { useGame } from "./store";
import { TownView } from "./town/TownView";
import { Sheet } from "./ui/HomePanels";

/** 外部チャットアプリへ組み込む際のエントリーポイント */
export function VirtualWorld() {
  const s = useGame();
  const [sheet, setSheet] = useState<null | "world" | "shop" | "edit" | "visitHome">(null);
  const [visitCode, setVisitCode] = useState("");
  const [shopTab, setShopTab] = useState<"house" | "furniture">("house");

  useEffect(() => {
    s.ensureInit();
    const onHide = () => document.visibilityState === "hidden" && useGame.getState().markClosed();
    const onUnload = () => useGame.getState().markClosed();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(() => useGame.setState({ toast: null }), 2800);
    return () => clearTimeout(t);
  }, [s.toast]);

  const v = s.visiting;
  const onPlot = (i: number) => {
    if (i !== 0) return s.notify(v ? "ほかの家には入れません" : "「街の編集」で家を入れ替えられます");
    if (v) setSheet("visitHome");
    else s.enterHome();
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {s.view === "town" ? (
        <TownView plots={v ? v.plots : s.plots} ownerName={v?.ownerName ?? null} myName={s.username} myHair={s.avatar.hairColor} myOutfit={s.avatar.outfit} onPlot={onPlot} />
      ) : (
        <HomeView />
      )}

      {/* 上部バー */}
      <div className={s.view === "home" ? "hidden" : "absolute inset-x-0 top-0 z-10 p-2"}>
        <div className="panel flex items-center gap-2 px-3 py-2">
          <span className="text-lg">🙂</span>
          <input aria-label="ユーザー名" className="field w-0 flex-1 font-bold" value={s.username} onChange={(e) => s.setUsername(e.target.value)} placeholder="ユーザー名" />
          <span className="chip bg-gold text-gold-foreground">🪙 {s.points.toLocaleString()}pt</span>
          <button className="btn btn-sm btn-accent" onClick={() => setSheet("world")}>🌐 {s.inviteCode || "…"}</button>
        </div>
        {v && s.view === "town" && (
          <div className="panel mt-2 flex items-center justify-between px-3 py-1.5 text-xs font-bold">
            <span>🚶 {v.ownerName}さんの街を訪問中（{v.code}）</span>
            <button className="btn btn-sm btn-primary" onClick={s.returnHome}>自分の街へ</button>
          </div>
        )}
      </div>

      {s.view === "town" && (
        <div className="absolute inset-x-0 bottom-0 z-10 p-3">
          {sheet === "world" && (
            <Sheet title="ワールド招待" onClose={() => setSheet(null)}>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">あなたの街の招待コード</label>
              <div className="mb-3 flex gap-2">
                <input className="field flex-1 font-bold tracking-widest" value={s.inviteCode} onChange={(e) => s.setInviteCode(e.target.value)} />
                <button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(s.inviteCode); s.notify("コピーしました"); }}>コピー</button>
              </div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">他の人の招待コードで遊びに行く</label>
              <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); s.visit(visitCode); setVisitCode(""); setSheet(null); }}>
                <input className="field flex-1 tracking-widest" value={visitCode} onChange={(e) => setVisitCode(e.target.value.toUpperCase())} placeholder="例: SAKURA7" />
                <button className="btn btn-primary" disabled={!visitCode.trim()}>訪問</button>
              </form>
              <div className="border-t pt-2 text-xs text-muted-foreground">
                テスト用：<button className="btn btn-sm ml-1" onClick={() => s.debugAdvance(3)}>3時間経過させる（植物の成長確認）</button>
              </div>
            </Sheet>
          )}
          {sheet === "visitHome" && v && (
            <Sheet title={`${v.ownerName}さんの自宅`} onClose={() => setSheet(null)}>
              {v.status === "none" && <button className="btn btn-primary w-full" onClick={s.requestEntry}>入室許可をリクエスト</button>}
              {v.status === "pending" && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm">リクエスト送信中…{v.ownerName}さんの返事を待っています。</p>
                  <div className="flex gap-2">
                    <button className="btn btn-gold flex-1" onClick={() => s.simulateEntry(true)}>テスト：許可シミュレーション</button>
                    <button className="btn flex-1" onClick={() => s.simulateEntry(false)}>テスト：拒否</button>
                  </div>
                </div>
              )}
              {v.status === "granted" && (
                <button className="btn btn-primary w-full" onClick={() => { setSheet(null); s.enterHome(); }}>✅ 許可されました！見学する（閲覧専用）</button>
              )}
              {v.status === "denied" && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm">入室は許可されませんでした。</p>
                  <button className="btn" onClick={s.requestEntry}>もう一度リクエスト</button>
                </div>
              )}
            </Sheet>
          )}
          {sheet === "shop" && (
            <Sheet title="ショップ" onClose={() => setSheet(null)}>
              <div className="mb-2 flex gap-1">
                <button className={`btn btn-sm ${shopTab === "house" ? "btn-primary" : ""}`} onClick={() => setShopTab("house")}>家</button>
                <button className={`btn btn-sm ${shopTab === "furniture" ? "btn-primary" : ""}`} onClick={() => setShopTab("furniture")}>家具</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {shopTab === "house"
                  ? HOUSES.map((h) => {
                      const owned = s.ownedHouses.includes(h.id);
                      return (
                        <div key={h.id} className="flex items-center justify-between rounded-xl bg-secondary px-2 py-1.5 text-xs">
                          <span className="font-bold">{h.name}</span>
                          <button className="btn btn-sm btn-primary" disabled={owned} onClick={() => s.buyHouse(h.id)}>{owned ? "所持" : `${h.price}pt`}</button>
                        </div>
                      );
                    })
                  : FURNITURE_CATALOG.map((f) => (
                      <div key={f.type} className="flex items-center justify-between gap-1 rounded-xl bg-secondary px-2 py-1.5 text-xs">
                        <span className="truncate font-bold">{f.name}</span>
                        <button className="btn btn-sm btn-primary" onClick={() => s.buyFurniture(f.type)}>{f.price}pt</button>
                      </div>
                    ))}
              </div>
              {shopTab === "furniture" && <p className="mt-2 text-xs text-muted-foreground">購入した家具は自宅の「家具配置」から置けます。</p>}
            </Sheet>
          )}
          {sheet === "edit" && (
            <Sheet title="街の編集（家の入れ替え）" onClose={() => setSheet(null)}>
              {s.plots.map((p, i) => (
                <div key={i} className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold">{i === 0 ? "🏠 自宅" : `区画 ${i}`}</span>
                  <select className="field" value={p ?? ""} onChange={(e) => s.setPlot(i, e.target.value || null)}>
                    {i !== 0 && <option value="">（空き地）</option>}
                    {s.ownedHouses.map((id) => (
                      <option key={id} value={id}>{HOUSES.find((h) => h.id === id)?.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </Sheet>
          )}
          {!v && (
            <div className="mt-2 flex gap-2">
              <button className="btn btn-primary flex-1" onClick={() => s.enterHome()}>🏠 自宅に入る</button>
              <button className="btn flex-1" onClick={() => setSheet("shop")}>🛍 ショップ</button>
              <button className="btn flex-1" onClick={() => setSheet("edit")}>🧱 街の編集</button>
            </div>
          )}
          {v && !sheet && <p className="panel px-3 py-2 text-center text-xs font-bold">{v.ownerName}さんの自宅をタップして入室をリクエストしよう</p>}
        </div>
      )}

      {s.toast && (
        <div key={s.toast.at} className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center px-4">
          <div className="panel px-4 py-2 text-sm font-bold animate-in fade-in slide-in-from-top-2">{s.toast.msg}</div>
        </div>
      )}
    </div>
  );
}
