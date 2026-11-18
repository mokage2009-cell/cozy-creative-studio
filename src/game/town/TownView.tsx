import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrthographicCamera } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { HOUSES, NPC_NAMES } from "../catalog";
import type { HouseDef } from "../types";

const PLOT_POS: [number, number][] = [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]];
const TREES: [number, number][] = [[-6, 0.9], [6, -1], [-1.2, -6], [1.3, 6], [-6.2, -6.2], [6.2, 6.2], [6.1, -6], [-6, 6.1]];

function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.zoom = Math.min(size.width, size.height * 1.2) / 13;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function House({ def, isHome, label, onClick }: { def: HouseDef; isHome: boolean; label: string; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const pin = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (pin.current) {
      pin.current.position.y = 3.6 + Math.sin(clock.getElapsedTime() * 2.5) * 0.15;
      pin.current.rotation.y = clock.getElapsedTime();
    }
  });
  const body: [number, number, number] = def.style === "tower" ? [1.6, 2.6, 1.6] : def.style === "modern" ? [2.3, 1.8, 2] : [2.1, 1.4, 2];
  const [bw, bh, bd] = body;
  return (
    <group onClick={onClick}>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <boxGeometry args={[3.4, 0.06, 3.4]} />
        <meshStandardMaterial color="#a9d88f" />
      </mesh>
      <mesh castShadow position={[0, bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial color={def.wall} roughness={0.8} />
      </mesh>
      {def.style === "modern" ? (
        <mesh castShadow position={[0, bh + 0.08, 0]}>
          <boxGeometry args={[bw + 0.3, 0.16, bd + 0.3]} />
          <meshStandardMaterial color={def.roof} />
        </mesh>
      ) : (
        <mesh castShadow position={[0, bh + (def.style === "tower" ? 0.7 : 0.5), 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[def.style === "tower" ? 1.3 : 1.75, def.style === "tower" ? 1.4 : 1.0, def.style === "tower" ? 8 : 4]} />
          <meshStandardMaterial color={def.roof} roughness={0.6} />
        </mesh>
      )}
      {def.style === "cafe" && (
        <mesh castShadow position={[0, 1.05, bd / 2 + 0.3]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[bw, 0.06, 0.7]} />
          <meshStandardMaterial color={def.roof} />
        </mesh>
      )}
      <mesh position={[0, 0.42, bd / 2 + 0.01]}>
        <planeGeometry args={[0.5, 0.8]} />
        <meshStandardMaterial color="#8f5f3a" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[bw / 2 + 0.01, bh * 0.6, s * 0.45]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.45, 0.45]} />
          <meshStandardMaterial color="#bfe3f5" emissive="#fff3c4" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {isHome && (
        <group ref={pin}>
          <mesh castShadow>
            <octahedronGeometry args={[0.32]} />
            <meshStandardMaterial color="#e8735a" emissive="#e8735a" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}
      <Html position={[0, isHome ? 4.3 : bh + 1.6, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className={isHome ? "chip bg-primary text-primary-foreground shadow-soft whitespace-nowrap" : "nametag"}>{label}</div>
      </Html>
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.7, 8]} />
        <meshStandardMaterial color="#8f5f3a" />
      </mesh>
      <mesh castShadow position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.55, 20, 16]} />
        <meshStandardMaterial color="#6fb35f" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.25, 1.35, 0.1]}>
        <sphereGeometry args={[0.35, 16, 12]} />
        <meshStandardMaterial color="#86c66f" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Chibi({ name, hair, outfit, seed, isMe }: { name: string; hair: string; outfit: string; seed: number; isMe?: boolean }) {
  const g = useRef<Group>(null);
  const body = useRef<Group>(null);
  const st = useRef({ tx: 0, tz: 0, wait: seed * 0.7 });
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const grp = g.current;
    if (!grp) return;
    const s = st.current;
    const dx = s.tx - grp.position.x, dz = s.tz - grp.position.z;
    const d = Math.hypot(dx, dz);
    const t = clock.getElapsedTime();
    if (d < 0.05) {
      s.wait -= dt;
      if (s.wait <= 0) {
        const r = Math.random;
        if (r() < 0.5) { s.tx = (r() - 0.5) * 1.2; s.tz = (r() - 0.5) * 12; } else { s.tx = (r() - 0.5) * 12; s.tz = (r() - 0.5) * 1.2; }
        s.wait = 1 + r() * 2;
      }
      if (body.current) body.current.position.y = 0;
    } else {
      const step = Math.min(d, 1.1 * dt);
      grp.position.x += (dx / d) * step;
      grp.position.z += (dz / d) * step;
      grp.rotation.y = Math.atan2(dx, dz);
      if (body.current) body.current.position.y = Math.abs(Math.sin(t * 10 + seed)) * 0.08;
    }
  });
  return (
    <group ref={g} position={[seed % 2 ? 0 : seed - 2, 0, seed % 2 ? seed - 2 : 0]}>
      <group ref={body}>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} castShadow position={[x, 0.12, 0]}>
            <capsuleGeometry args={[0.06, 0.12, 4, 8]} />
            <meshStandardMaterial color="#3b4a63" />
          </mesh>
        ))}
        <mesh castShadow position={[0, 0.36, 0]}>
          <capsuleGeometry args={[0.16, 0.16, 6, 14]} />
          <meshStandardMaterial color={outfit} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.34, 28, 20]} />
          <meshStandardMaterial color="#f6d2b8" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 0.88, -0.03]} rotation={[-0.5, 0, 0]}>
          <sphereGeometry args={[0.37, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hair} roughness={0.5} />
        </mesh>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.78, 0.3]} scale={[0.8, 1.2, 0.5]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#2b2230" />
          </mesh>
        ))}
        {[-0.2, 0.2].map((x) => (
          <mesh key={`c${x}`} position={[x, 0.68, 0.27]} scale={[1, 0.6, 0.4]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#f29a9a" />
          </mesh>
        ))}
      </group>
      <Html position={[0, 1.45, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className={isMe ? "chip bg-accent text-accent-foreground" : "nametag"}>{name}</div>
      </Html>
    </group>
  );
}

export function TownView({ plots, ownerName, myName, myHair, myOutfit, onPlot }: { plots: (string | null)[]; ownerName: string | null; myName: string; myHair: string; myOutfit: string; onPlot: (i: number) => void }) {
  const npcs = useMemo(() => NPC_NAMES.map((n, i) => ({ n, hair: ["#4a2f25", "#e8c47a", "#1f1a1a", "#d9a2b8"][i] ?? "#619989", outfit: ["#5b8fd6", "#f2c14e", "#3fa39a", "#7f6bb8"][i] ?? "#619989" })), []);
  return (
    <div className="absolute inset-0 bg-sky">
      <Canvas shadows dpr={[1, 2]}>
        <OrthographicCamera makeDefault position={[20, 20, 20]} near={0.1} far={200} onUpdate={(c) => c.lookAt(0, 0, 0)} />
        <FitCamera />
        <ambientLight intensity={0.75} />
        <hemisphereLight args={["#fff4e0", "#9fd08a", 0.5]} />
        <directionalLight castShadow position={[8, 14, 4]} intensity={1.5} shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
        <mesh receiveShadow position={[0, -0.15, 0]}>
          <boxGeometry args={[14, 0.3, 14]} />
          <meshStandardMaterial color="#8fcf7a" roughness={1} />
        </mesh>
        <mesh receiveShadow position={[0, 0.01, 0]}>
          <boxGeometry args={[1.6, 0.02, 14]} />
          <meshStandardMaterial color="#f1e2c2" />
        </mesh>
        <mesh receiveShadow position={[0, 0.012, 0]}>
          <boxGeometry args={[14, 0.02, 1.6]} />
          <meshStandardMaterial color="#f1e2c2" />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.6, 0.7, 0.5, 24]} />
          <meshStandardMaterial color="#e9e3f2" />
        </mesh>
        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 24]} />
          <meshStandardMaterial color="#7ec8e3" emissive="#7ec8e3" emissiveIntensity={0.3} />
        </mesh>
        {TREES.map(([x, z], i) => <Tree key={i} x={x} z={z} />)}
        {plots.map((id, i) => {
          const def = HOUSES.find((h) => h.id === id);
          const [x, z] = PLOT_POS[i] ?? "#619989";
          if (!def) {
            return (
              <mesh key={i} position={[x, 0.03, z]} receiveShadow onClick={(e) => { e.stopPropagation(); onPlot(i); }}>
                <boxGeometry args={[3.4, 0.06, 3.4]} />
                <meshStandardMaterial color="#c7e3b4" />
              </mesh>
            );
          }
          const label = i === 0 ? (ownerName ? `${ownerName}さんの自宅` : "🏠 自宅") : def.name;
          return (
            <group key={i} position={[x, 0, z]}>
              <House def={def} isHome={i === 0} label={label} onClick={(e) => { e.stopPropagation(); onPlot(i); }} />
            </group>
          );
        })}
        <Chibi name={myName || "あなた"} hair={myHair} outfit={myOutfit} seed={0} isMe />
        {npcs.map((p, i) => <Chibi key={p.n} name={p.n} hair={p.hair} outfit={p.outfit} seed={i + 1} />)}
      </Canvas>
    </div>
  );
}
