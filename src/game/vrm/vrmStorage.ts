// アップロードしたVRMをIndexedDBに保存（再読み込み後も残る）
import avatarAsset from "@/assets/default-avatar.vrm.asset.json";
const DB = "vw-vrm";
const STORE = "models";
export const CUSTOM_VRM_REF = "idb:custom";
export const DEFAULT_VRM_URL = avatarAsset.url;

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function saveVrm(file: Blob, key = "custom") {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
export async function loadVrm(key = "custom"): Promise<Blob | null> {
  const db = await open();
  return new Promise((res, rej) => {
    const r = db.transaction(STORE).objectStore(STORE).get(key);
    r.onsuccess = () => res((r.result as Blob) ?? null);
    r.onerror = () => rej(r.error);
  });
}

/** 画像を最大512pxに縮小してdataURL化（服テクスチャ用） */
export function imageToDataUrl(file: File, max = 512): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); rej(new Error("Canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = rej;
    img.src = url;
  });
}
