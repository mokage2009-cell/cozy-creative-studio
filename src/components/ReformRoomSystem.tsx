import React, { useState, useEffect } from "react";
import {
  Hammer,
  Check,
  Trash2,
  Route,
  Sparkles,
  Shirt,
  Activity,
  Home,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type RoomType = "living" | "fitting" | "atelier" | "motion" | "corridor";

export interface GridCellData {
  x: number; // 0 〜 8
  z: number; // 0 〜 8
  type: RoomType;
  label: string;
}

export interface RoomConnection {
  north: boolean; // z - 1 と繋がっているか
  south: boolean; // z + 1 と繋がっているか
  west: boolean;  // x - 1 と繋がっているか
  east: boolean;  // x + 1 と繋がっているか
}

const GRID_SIZE = 9;
const CENTER = 4; // (4, 4) が最初のメインリビング

export const INITIAL_LAYOUT: GridCellData[] = [
  { x: CENTER, z: CENTER, type: "living", label: "メインリビング" },
];

const ROOM_CATALOG: { type: RoomType; label: string; color: string; icon: React.ReactNode }[] = [
  { type: "fitting", label: "試着室", color: "bg-pink-500", icon: <Sparkles className="h-4 w-4" /> },
  { type: "atelier", label: "服デザイン工房", color: "bg-amber-500", icon: <Shirt className="h-4 w-4" /> },
  { type: "motion", label: "モーションスタジオ", color: "bg-indigo-500", icon: <Activity className="h-4 w-4" /> },
];

// 隣接マスとの接続（壁にドア・開口部を作る判定）を計算するヘルパー関数（3D描画側でも利用可能）
export function getCellConnections(cell: GridCellData, allCells: GridCellData[]): RoomConnection {
  const hasCellAt = (tx: number, tz: number) => allCells.some((c) => c.x === tx && c.z === tz);
  return {
    north: hasCellAt(cell.x, cell.z - 1),
    south: hasCellAt(cell.x, cell.z + 1),
    west: hasCellAt(cell.x - 1, cell.z),
    east: hasCellAt(cell.x + 1, cell.z),
  };
}

// メインリビング(4,4)から新しい部屋への最短通路を自動生成するアルゴリズム
function generateShortestCorridors(cells: GridCellData[], targetX: number, targetZ: number): GridCellData[] {
  const occupied = new Map<string, GridCellData>();
  cells.forEach((c) => occupied.set(`${c.x},${c.z}`, c));

  // 幅優先探索（BFS）で既存部屋・通路からターゲットまでの最短経路を探す
  const queue: { x: number; z: number; path: { x: number; z: number }[] }[] = [];
  const visited = new Set<string>();

  cells.forEach((c) => {
    if (c.x !== targetX || c.z !== targetZ) {
      queue.push({ x: c.x, z: c.z, path: [] });
      visited.add(`${c.x},${c.z}`);
    }
  });

  const dirs = [
    { dx: 0, dz: -1 },
    { dx: 0, dz: 1 },
    { dx: -1, dz: 0 },
    { dx: 1, dz: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === targetX && current.z === targetZ) {
      const nextCells = [...cells];
      current.path.forEach((p) => {
        const key = `${p.x},${p.z}`;
        if (!occupied.has(key)) {
          nextCells.push({ x: p.x, z: p.z, type: "corridor", label: "通路" });
        }
      });
      return nextCells;
    }

    for (const d of dirs) {
      const nx = current.x + d.dx;
      const nz = current.z + d.dz;
      const key = `${nx},${nz}`;
      if (nx < 0 || nx >= GRID_SIZE || nz < 0 || nz >= GRID_SIZE || visited.has(key)) continue;

      const existing = occupied.get(key);
      // 他の部屋の上は突き抜けず、空きマスかターゲットのみ通る
      if (!existing || (nx === targetX && nz === targetZ)) {
        visited.add(key);
        const nextPath =
          nx === targetX && nz === targetZ ? current.path : [...current.path, { x: nx, z: nz }];
        queue.push({ x: nx, z: nz, path: nextPath });
      }
    }
  }
  return cells;
}

interface ReformModalProps {
  layout: GridCellData[];
  onSaveLayout: (newLayout: GridCellData[]) => void;
  onClose: () => void;
}

export const ReformModal: React.FC<ReformModalProps> = ({ layout, onSaveLayout, onClose }) => {
  const [draftLayout, setDraftLayout] = useState<GridCellData[]>(layout);
  const [selectedTool, setSelectedTool] = useState<RoomType | "corridor_edit" | "delete">("fitting");
  const [zoom, setZoom] = useState<number>(1);

  const getCell = (x: number, z: number) => draftLayout.find((c) => c.x === x && c.z === z);

  const handleCellClick = (x: number, z: number) => {
    // 中心のメインリビングは削除・上書き不可
    if (x === CENTER && z === CENTER) return;

    const existing = getCell(x, z);

    // 削除モード
    if (selectedTool === "delete") {
      if (existing) {
        setDraftLayout(draftLayout.filter((c) => !(c.x === x && c.z === z)));
      }
      return;
    }

    // 通路手動カスタムモード（タップで通路のON/OFF切り替え）
    if (selectedTool === "corridor_edit") {
      if (existing?.type === "corridor") {
        setDraftLayout(draftLayout.filter((c) => !(c.x === x && c.z === z)));
      } else if (!existing) {
        setDraftLayout([...draftLayout, { x, z, type: "corridor", label: "通路" }]);
      }
      return;
    }

    // 部屋の増築配置モード（置いた瞬間にメインリビングと結ぶ通路を自動生成）
    const roomMeta = ROOM_CATALOG.find((r) => r.type === selectedTool);
    if (!roomMeta) return;

    const filtered = draftLayout.filter((c) => !(c.x === x && c.z === z));
    const withNewRoom: GridCellData[] = [
      ...filtered,
      { x, z, type: roomMeta.type, label: roomMeta.label },
    ];
    const withAutoCorridor = generateShortestCorridors(withNewRoom, x, z);
    setDraftLayout(withAutoCorridor);
  };

  const handleComplete = () => {
    localStorage.setItem("cozy_house_layout_v1", JSON.stringify(draftLayout));
    onSaveLayout(draftLayout);
    onClose();
  };

  const handleReset = () => {
    setDraftLayout(INITIAL_LAYOUT);
  };

  const getCellStyle = (cell?: GridCellData) => {
    if (!cell) return "bg-white/60 border-dashed border-slate-300 hover:bg-emerald-50";
    switch (cell.type) {
      case "living":
        return "bg-emerald-500 text-white border-emerald-600 shadow-md";
      case "fitting":
        return "bg-pink-500 text-white border-pink-600 shadow-md";
      case "atelier":
        return "bg-amber-500 text-white border-amber-600 shadow-md";
      case "motion":
        return "bg-indigo-500 text-white border-indigo-600 shadow-md";
      case "corridor":
        return "bg-stone-300 text-stone-700 border-stone-400";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-900/80 backdrop-blur-md">
      {/* 上部ヘッダー */}
      <div className="flex items-center justify-between bg-white/95 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Hammer className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-800">自宅リフォーム・増築モード</h2>
            <p className="text-[11px] text-slate-500">枠内をタップして部屋を設置すると通路が自動生成されます</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            1部屋に戻す
          </button>
          <button
            onClick={handleComplete}
            className="flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600"
          >
            <Check className="h-4 w-4" />
            完了して反映
          </button>
        </div>
      </div>

      {/* 中央：スクロール＆ズーム可能な広い増築敷地枠（9x9グリッド） */}
      <div className="relative flex-1 overflow-auto p-6 flex items-center justify-center">
        {/* ズームボタン */}
        <div className="fixed right-4 top-20 z-10 flex flex-col gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
            className="rounded-full bg-white/90 p-2 text-slate-700 shadow-md hover:bg-white"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="rounded-full bg-white/90 p-2 text-slate-700 shadow-md hover:bg-white"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          className="grid grid-cols-9 gap-1.5 rounded-2xl border-2 border-emerald-400/50 bg-emerald-950/40 p-3 shadow-2xl transition-transform"
        >
          {Array.from({ length: GRID_SIZE }).map((_, z) =>
            Array.from({ length: GRID_SIZE }).map((__, x) => {
              const cell = getCell(x, z);
              const conn = cell ? getCellConnections(cell, draftLayout) : null;
              return (
                <button
                  key={`${x}-${z}`}
                  onClick={() => handleCellClick(x, z)}
                  className={`relative flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center rounded-xl border-2 text-[10px] font-bold transition active:scale-95 ${getCellStyle(
                    cell
                  )}`}
                >
                  {cell?.type === "living" && <Home className="mb-0.5 h-4 w-4" />}
                  <span className="leading-tight text-center px-0.5">
                    {cell ? cell.label : "+"}
                  </span>

                  {/* 隣接マスとの通路ドア接続インジケーター */}
                  {conn?.north && <span className="absolute -top-1.5 h-1.5 w-4 rounded bg-yellow-300" />}
                  {conn?.south && <span className="absolute -bottom-1.5 h-1.5 w-4 rounded bg-yellow-300" />}
                  {conn?.west && <span className="absolute -left-1.5 h-4 w-1.5 rounded bg-yellow-300" />}
                  {conn?.east && <span className="absolute -right-1.5 h-4 w-1.5 rounded bg-yellow-300" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 下部パレット：増築する部屋リスト＆通路手動カスタム＆削除ツール */}
      <div className="bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {ROOM_CATALOG.map((room) => (
            <button
              key={room.type}
              onClick={() => setSelectedTool(room.type)}
