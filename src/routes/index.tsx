import { createFileRoute } from "@tanstack/react-router";
import { VirtualWorld } from "@/game/VirtualWorld";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ポケットタウン｜仮想空間ゲーム" },
      { name: "description", content: "自分の街と3Dルームでアバターと暮らす仮想空間ゲーム。招待コードで友だちの街にも遊びに行けます。" },
      { property: "og:title", content: "ポケットタウン｜仮想空間ゲーム" },
      { property: "og:description", content: "自分の街と3Dルームでアバターと暮らす仮想空間ゲーム。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VirtualWorld,
});
