import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { FurnitureItem } from "../types";

const WOOD = "#c9925e";
const WOOD_DARK = "#8f5f3a";

export function Furniture3D({ item, plantScale, selected }: { item: FurnitureItem; plantScale: number; selected?: boolean }) {
  return (
    <group>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[1.2, 1.35, 48]} />
          <meshBasicMaterial color="#e8735a" />
        </mesh>
      )}
      {item.type === "bed" && <Bed />}
      {item.type === "sofa" && <Sofa />}
      {item.type === "kitchen" && <Kitchen />}
      {item.type === "plant" && <Plant scale={plantScale} />}
      {item.type === "table" && <Table />}
      {item.type === "lamp" && <Lamp />}
      {item.type === "special" && <Special item={item} />}
    </group>
  );
}

function Bed() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1.5, 0.3, 2.1]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.4, 0.2, 2.0]} />
        <meshStandardMaterial color="#fbf7f0" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.5, 0.35]}>
        <boxGeometry args={[1.44, 0.14, 1.3]} />
        <meshStandardMaterial color="#8fc6c0" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.62, -0.75]} scale={[1, 0.4, 0.6]}>
        <sphereGeometry args={[0.45, 20, 14]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.65, -1.02]}>
        <boxGeometry args={[1.5, 0.9, 0.08]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Sofa() {
  const c = "#e9a07a";
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[2, 0.35, 0.9]} />
        <meshStandardMaterial color={c} roughness={0.9} />
      </mesh>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} castShadow position={[x, 0.47, 0.03]}>
          <boxGeometry args={[0.95, 0.12, 0.8]} />
          <meshStandardMaterial color="#f2b892" roughness={0.95} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.7, -0.35]}>
        <boxGeometry args={[2, 0.65, 0.22]} />
        <meshStandardMaterial color={c} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 1.0, 0.5, 0]}>
          <boxGeometry args={[0.2, 0.5, 0.9]} />
          <meshStandardMaterial color={c} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Kitchen() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.43, 0]}>
        <boxGeometry args={[2.2, 0.86, 0.7]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.88, 0]}>
        <boxGeometry args={[2.26, 0.05, 0.76]} />
        <meshStandardMaterial color="#5c6b7a" roughness={0.35} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.45, 0.36]}>
          <boxGeometry args={[0.95, 0.7, 0.02]} />
          <meshStandardMaterial color="#9fd3cc" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.5, 0.91, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.18, 24]} />
        <meshBasicMaterial color="#ff6a3d" />
      </mesh>
      <Kettle />
    </group>
  );
}

function Kettle() {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (g.current) g.current.rotation.z = Math.sin(t * 25) * 0.025;
  });
  return (
    <group position={[0.5, 0.92, 0]}>
      <group ref={g}>
        <mesh castShadow position={[0, 0.13, 0]} scale={[1, 0.85, 1]}>
          <sphereGeometry args={[0.16, 24, 18]} />
          <meshStandardMaterial color="#d8dde3" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0.17, 0.16, 0]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.02, 0.035, 0.16, 10]} />
          <meshStandardMaterial color="#d8dde3" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.09, 0.015, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#2b2b33" />
        </mesh>
      </group>
      <Steam origin={[0.24, 0.24, 0]} />
    </group>
  );
}

function Steam({ origin }: { origin: [number, number, number] }) {
  const refs = useRef<(Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * 0.6 + i / 5) % 1;
      m.position.set(origin[0] + p * 0.15 + Math.sin(t * 3 + i) * 0.03, origin[1] + p * 0.6, origin[2]);
      m.scale.setScalar(0.4 + p * 1.2);
      (m.material as { opacity: number }).opacity = 0.7 * (1 - p);
    });
  });
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function Plant({ scale }: { scale: number }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const cur = g.current.scale.x;
    const next = cur + (scale - cur) * Math.min(1, dt * 2);
    g.current.scale.setScalar(next);
    g.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.03;
  });
  const leaves: [number, number, number, number][] = [
    [0, 0.55, 0, 0], [0.18, 0.45, 0.05, 0.8], [-0.18, 0.42, 0.04, -0.8], [0.05, 0.4, 0.2, 0.3], [-0.06, 0.38, -0.18, -0.3], [0.12, 0.62, -0.08, 0.5],
  ];
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.24, 0.18, 0.4, 24]} />
        <meshStandardMaterial color="#e5b98f" roughness={0.8} />
      </mesh>
      <group ref={g} position={[0, 0.38, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.5, 8]} />
          <meshStandardMaterial color="#5a7d3a" />
        </mesh>
        {leaves.map(([x, y, z, r], i) => (
          <mesh key={i} castShadow position={[x, y, z]} rotation={[0.3, i, r]} scale={[1, 0.35, 0.55]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color={i % 2 ? "#5fa35a" : "#78bd63"} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Table() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.06, 32]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 0.4, 12]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      <mesh castShadow position={[0.15, 0.48, 0.1]}>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group>
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.04, 20]} />
        <meshStandardMaterial color="#3b4a63" />
      </mesh>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
        <meshStandardMaterial color="#3b4a63" />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.18, 0.3, 0.35, 24, 1, true]} />
        <meshStandardMaterial color="#fff1cc" emissive="#ffd88a" emissiveIntensity={0.8} side={2} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} intensity={2} distance={4} color="#ffd9a0" />
    </group>
  );
}

function Special({ item }: { item: FurnitureItem }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (g.current) {
      g.current.position.y = 0.75 + Math.sin(t * 2) * 0.06;
      g.current.rotation.y = t * 0.6;
    }
  });
  const isIce = item.name.includes("氷");
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.35, 0.42, 0.4, 24]} />
        <meshStandardMaterial color="#e9e3f2" roughness={0.5} />
      </mesh>
      <group ref={g}>
        <mesh castShadow>
          {isIce ? <boxGeometry args={[0.45, 0.45, 0.45]} /> : <icosahedronGeometry args={[0.28, 1]} />}
          <meshPhysicalMaterial
            color={item.color ?? "#bfe9ff"}
            roughness={0.05}
            transmission={isIce ? 0.6 : 0.2}
            thickness={0.5}
            emissive={item.color ?? "#bfe9ff"}
            emissiveIntensity={0.35}
          />
        </mesh>
      </group>
    </group>
  );
}
