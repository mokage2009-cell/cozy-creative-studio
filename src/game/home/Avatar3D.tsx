import { useFrame, useLoader } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Color, SRGBColorSpace, TextureLoader, Vector3, type Group, type Material, type Mesh, type Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import { DEFAULT_AVATAR } from "../catalog";
import { avatarDims } from "../logic";
import { useGame } from "../store";
import { ARM_DROP, poseAngles, sampleStudioMotion, vrmScale } from "../vrm/vrmPose";
import { DEFAULT_VRM_URL, loadVrm } from "../vrm/vrmStorage";
import type { AvatarConfig, Pose, StudioFrame } from "../types";

export interface AvatarModelProps {
  config: AvatarConfig;
  pose: Pose;
  motion?: StudioFrame[] | null;
}

/** config.modelUrl があればそのVRM、なければ初期VRM（public/default-avatar.vrm）を表示 */
export function AvatarModel(props: AvatarModelProps) {
  const ref = props.config.modelUrl || DEFAULT_VRM_URL;
  const url = useResolvedUrl(ref);
  if (!url) return null;
  return (
    <VrmErrorBoundary key={url} fallback={<ProceduralHuman {...props} />}>
      <Suspense fallback={null}>
        <VrmHuman url={url} {...props} />
      </Suspense>
    </VrmErrorBoundary>
  );
}

function useResolvedUrl(ref: string) {
  const [url, setUrl] = useState<string | null>(ref.startsWith("idb:") ? null : ref);
  useEffect(() => {
    if (!ref.startsWith("idb:")) { setUrl(ref); return; }
    let obj: string | null = null;
    let alive = true;
    loadVrm(ref.slice(4).split("#")[0]).then((b) => {
      if (!alive) return;
      if (!b) { setUrl(DEFAULT_VRM_URL); return; }
      obj = URL.createObjectURL(b);
      setUrl(obj);
    }).catch(() => alive && setUrl(DEFAULT_VRM_URL));
    return () => { alive = false; if (obj) URL.revokeObjectURL(obj); };
  }, [ref]);
  return url;
}

class VrmErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  override state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  override componentDidCatch(e: unknown) { console.error("VRM読み込み失敗", e); }
  override render() { return this.state.err ? this.props.fallback : this.props.children; }
}

const CLOTH_RE = /cloth|tops|bottom|outfit|onepiece|shirt|dress|skirt|pants|jacket|coat|服/i;

function VrmHuman({ url, config, pose, motion }: AvatarModelProps & { url: string }) {
  const gltf = useLoader(GLTFLoader, url, (l) => l.register((p) => new VRMLoaderPlugin(p)));
  const vrm = gltf.userData["vrm"] as VRM;
  const clothing = useGame((s) => s.clothing);
  const liveTexture = useGame((s) => s.liveTexture);
  const tex = liveTexture || clothing.find((c) => c.id === config.clothingId)?.textureUrl;

  const natural = useMemo(() => {
    VRMUtils.rotateVRM0(vrm);
    vrm.scene.traverse((o) => { o.frustumCulled = false; if ((o as Mesh).isMesh) o.castShadow = true; });
    vrm.scene.updateMatrixWorld(true);
    const head = vrm.humanoid.getRawBoneNode("head");
    const v = new Vector3();
    head?.getWorldPosition(v);
    return head ? v.y / 0.9 : 1.6;
  }, [vrm]);

  // 服マテリアル（色・テクスチャ）
  const clothMats = useMemo(() => {
    const out: { m: Material & { color?: Color; map?: Texture | null; shadeColorFactor?: Color; needsUpdate: boolean }; color: Color | null; map: Texture | null }[] = [];
    const seen = new Set<Material>();
    vrm.scene.traverse((o) => {
      const mats = (o as Mesh).isMesh ? ([] as Material[]).concat((o as Mesh).material) : [];
      for (const m of mats) {
        if (seen.has(m) || !CLOTH_RE.test(m.name + " " + o.name)) continue;
        seen.add(m);
        const mm = m as (typeof out)[number]["m"];
        out.push({ m: mm, color: mm.color?.clone() ?? null, map: mm.map ?? null });
      }
    });
    return out;
  }, [vrm]);

  useEffect(() => {
    let t: Texture | null = null;
    const apply = (map: Texture | null, tint: boolean) => {
      for (const c of clothMats) {
        c.m.map = map ?? c.map;
        if (c.m.color && c.color) {
          c.m.color.copy(c.color);
          if (tint && !map) c.m.color.multiply(new Color(config.outfit).lerp(new Color("#ffffff"), 0.35));
        }
        c.m.needsUpdate = true;
      }
    };
    if (tex) {
      new TextureLoader().load(tex, (loaded) => {
        loaded.colorSpace = SRGBColorSpace;
        loaded.flipY = false;
        t = loaded;
        apply(loaded, false);
      });
    } else apply(null, config.outfit !== DEFAULT_AVATAR.outfit);
    return () => { t?.dispose(); };
  }, [tex, clothMats, config.outfit]);

  const d = useMemo(() => avatarDims(config), [config]);
  const sc = vrmScale(config.height, d.width, natural);
  const root = useRef<Group>(null);

  useEffect(() => {
    // ポーズが大きく変わったときに揺れものを暴れさせない
    vrm.springBoneManager?.reset();
  }, [vrm, sc.y]);

  useFrame(({ clock }, delta) => {
    const a = motion ? sampleStudioMotion(motion, clock.getElapsedTime()) : poseAngles(pose, clock.getElapsedTime());
    const h = vrm.humanoid;
    vrm.expressionManager?.setValue("happy", config.mouth === "smile" ? 0.5 : 0);
    vrm.expressionManager?.setValue("aa", config.mouth === "open" ? 0.5 : 0);
    vrm.expressionManager?.setValue("blink", config.eyes === "sleepy" ? 0.6 : config.eyes === "narrow" ? 0.25 : 0);
    const b = (n: Parameters<typeof h.getNormalizedBoneNode>[0]) => h.getNormalizedBoneNode(n);
    const setX = (n: Parameters<typeof b>[0], x: number) => { const o = b(n); if (o) o.rotation.set(x, 0, 0); };
    setX("leftUpperLeg", a.lt); setX("rightUpperLeg", a.rt);
    setX("leftLowerLeg", a.lk); setX("rightLowerLeg", a.rk);
    setX("head", a.hx * 0.7); setX("neck", a.hx * 0.3);
    const la = b("leftUpperArm"); if (la) la.rotation.set(a.la, 0, -ARM_DROP + a.laz);
    const ra = b("rightUpperArm"); if (ra) ra.rotation.set(a.ra, 0, ARM_DROP + a.raz);
    const sp = b("spine"); if (sp) sp.rotation.set(0, 0, a.tz);
    const fl = b("leftLowerArm"); if (fl) fl.rotation.set(0, pose === "stand" ? 0 : 0.2, 0);
    const fr = b("rightLowerArm"); if (fr) fr.rotation.set(0, pose === "stand" ? 0 : -0.2, 0);
    if (root.current) { root.current.position.y = a.rootY; root.current.rotation.x = a.rootRX; }
    vrm.update(Math.min(delta, 0.05)); // SpringBone（髪・服の揺れ）もここで更新
  });

  return (
    <group ref={root}>
      <primitive object={vrm.scene} scale={[sc.x, sc.y, sc.z]} />
    </group>
  );
}

const PANTS = "#3b4a63";
const SHOE = "#2a2a33";

function ProceduralHuman({ config, pose }: AvatarModelProps) {
  const d = useMemo(() => avatarDims(config), [config]);
  const root = useRef<Group>(null);
  const lThigh = useRef<Group>(null);
  const rThigh = useRef<Group>(null);
  const lKnee = useRef<Group>(null);
  const rKnee = useRef<Group>(null);
  const lArm = useRef<Group>(null);
  const rArm = useRef<Group>(null);
  const head = useRef<Group>(null);
  const torsoG = useRef<Group>(null);

  const female = config.gender === "female";
  const w = d.width;
  const shoulderW = (female ? 0.16 : 0.2) * d.H * 0.6 * (0.85 + w * 0.15);
  const hipW = (female ? 0.1 : 0.085) * d.H * 0.6 * w;
  const limbR = 0.032 * d.H * (0.8 + w * 0.25);
  const torsoR = (female ? 0.095 : 0.105) * d.H * 0.6 * w;
  const armLen = d.H * 0.34;
  const hr = d.headR;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const set = (g: { current: Group | null }, x: number, z = 0) => {
      if (g.current) {
        g.current.rotation.x = x;
        g.current.rotation.z = z;
      }
    };
    let rootY = 0;
    let rootRX = 0;
    let lt = 0, rt = 0, lk = 0, rk = 0, la = 0, ra = 0, laz = 0.08, raz = -0.08, hx = 0, tz = 0;
    const breathe = Math.sin(t * 2) * 0.02;
    switch (pose) {
      case "walk": {
        const s = Math.sin(t * 8);
        lt = s * 0.55; rt = -s * 0.55; lk = Math.max(0, -s) * 0.6; rk = Math.max(0, s) * 0.6;
        la = -s * 0.5; ra = s * 0.5; rootY = Math.abs(Math.cos(t * 8)) * 0.03;
        break;
      }
      case "sit":
        lt = rt = -Math.PI / 2; lk = rk = Math.PI / 2; la = ra = -0.5; hx = 0.05 + breathe;
        break;
      case "sleep":
        rootRX = -Math.PI / 2; la = ra = 0; laz = 0.15; raz = -0.15; hx = 0;
        break;
      case "burn": {
        rootY = Math.abs(Math.sin(t * 14)) * 0.12;
        la = ra = -2.7 + Math.sin(t * 30) * 0.25; laz = 0.4; raz = -0.4; hx = -0.2;
        lt = Math.sin(t * 14) * 0.3; rt = -lt;
        break;
      }
      case "look":
        hx = 0.35; la = ra = -0.25; tz = 0; rootY = 0;
        break;
      case "wave":
        ra = -2.8; raz = -0.3 + Math.sin(t * 9) * 0.45; hx = breathe;
        break;
      case "dance": {
        rootY = Math.abs(Math.sin(t * 6)) * 0.08; tz = Math.sin(t * 6) * 0.15;
        la = -2.4 + Math.sin(t * 6) * 0.5; ra = -2.4 - Math.sin(t * 6) * 0.5;
        lt = Math.sin(t * 6) * 0.3; rt = -lt;
        break;
      }
      default:
        hx = breathe; la = Math.sin(t * 1.5) * 0.04; ra = -la;
    }
    if (root.current) {
      root.current.position.y = rootY;
      root.current.rotation.x = rootRX;
    }
    set(lThigh, lt); set(rThigh, rt); set(lKnee, lk); set(rKnee, rk);
    set(lArm, la, laz); set(rArm, ra, raz); set(head, hx);
    if (torsoG.current) torsoG.current.rotation.z = tz;
  });

  const skin = <meshStandardMaterial color={config.skin} roughness={0.6} />;
  const cloth = <meshStandardMaterial color={config.outfit} roughness={0.8} />;
  const pants = <meshStandardMaterial color={female ? config.outfit : PANTS} roughness={0.85} />;
  const hairMat = <meshStandardMaterial color={config.hairColor} roughness={0.55} />;
  const dark = <meshStandardMaterial color="#2b2230" roughness={0.3} />;

  const leg = (side: 1 | -1, thighRef: typeof lThigh, kneeRef: typeof lKnee) => (
    <group ref={thighRef} position={[side * hipW, 0, 0]}>
      <mesh castShadow position={[0, -d.thigh / 2, 0]}>
        <capsuleGeometry args={[limbR * 1.25, d.thigh - limbR * 2, 6, 12]} />
        {pants}
      </mesh>
      <group ref={kneeRef} position={[0, -d.thigh, 0]}>
        <mesh castShadow position={[0, -d.shin / 2, 0]}>
          <capsuleGeometry args={[limbR, d.shin - limbR * 2, 6, 12]} />
          {female ? skin : pants}
        </mesh>
        <mesh castShadow position={[0, -d.shin + 0.02, 0.04]}>
          <boxGeometry args={[limbR * 2.4, 0.06, 0.2]} />
          <meshStandardMaterial color={SHOE} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );

  const arm = (side: 1 | -1, ref: typeof lArm) => (
    <group ref={ref} position={[side * shoulderW, d.torso * 0.92, 0]}>
      <mesh castShadow position={[0, -armLen * 0.22, 0]}>
        <capsuleGeometry args={[limbR * 1.05, armLen * 0.36, 6, 12]} />
        {cloth}
      </mesh>
      <mesh castShadow position={[0, -armLen * 0.68, 0]}>
        <capsuleGeometry args={[limbR * 0.85, armLen * 0.4, 6, 12]} />
        {skin}
      </mesh>
      <mesh position={[0, -armLen * 0.97, 0]}>
        <sphereGeometry args={[limbR * 1.1, 12, 12]} />
        {skin}
      </mesh>
    </group>
  );

  const eyeScaleY = config.eyes === "round" ? 1 : config.eyes === "narrow" ? 0.45 : 0.3;
  const eyeY = config.eyes === "sleepy" ? -0.01 : 0;

  return (
    <group ref={root}>
      <group position={[0, d.legLen, 0]}>
        {leg(1, lThigh, lKnee)}
        {leg(-1, rThigh, rKnee)}
        <group ref={torsoG}>
          {/* 腰 */}
          <mesh castShadow position={[0, 0.02, 0]} scale={[1, 0.7, 0.75]}>
            <sphereGeometry args={[hipW + limbR * 1.4, 20, 16]} />
            {pants}
          </mesh>
          {female && (
            <mesh castShadow position={[0, -0.02, 0]}>
              <cylinderGeometry args={[hipW + limbR * 1.6, hipW * 2.6, d.H * 0.14, 20]} />
              {cloth}
            </mesh>
          )}
          {/* 胴体 */}
          <mesh castShadow position={[0, d.torso * 0.5, 0]} scale={[1, 1, 0.68]}>
            <capsuleGeometry args={[torsoR, d.torso * 0.6, 8, 20]} />
            {cloth}
          </mesh>
          <mesh castShadow position={[0, d.torso * 0.88, 0]} scale={[1, 0.45, 0.6]}>
            <sphereGeometry args={[shoulderW + limbR * 0.6, 20, 12]} />
            {cloth}
          </mesh>
          {arm(1, lArm)}
          {arm(-1, rArm)}
          {/* 首 */}
          <mesh position={[0, d.torso + 0.03, 0]}>
            <cylinderGeometry args={[hr * 0.38, hr * 0.42, 0.1, 12]} />
            {skin}
          </mesh>
          {/* 頭 */}
          <group ref={head} position={[0, d.torso + 0.06 + hr, 0]}>
            <mesh castShadow scale={[0.92, 1.05, 0.98]}>
              <sphereGeometry args={[hr, 32, 24]} />
              {skin}
            </mesh>
            {[1, -1].map((s) => (
              <mesh key={s} position={[s * hr * 0.92, 0, 0]} scale={[0.4, 0.7, 0.5]}>
                <sphereGeometry args={[hr * 0.3, 12, 12]} />
                {skin}
              </mesh>
            ))}
            {[1, -1].map((s) => (
              <group key={s} position={[s * hr * 0.36, hr * 0.08 + eyeY, hr * 0.86]}>
                <mesh scale={[0.8, eyeScaleY * 1.1, 0.4]}>
                  <sphereGeometry args={[hr * 0.16, 14, 14]} />
                  {dark}
                </mesh>
                {config.eyes === "round" && (
                  <mesh position={[hr * 0.04, hr * 0.05, hr * 0.06]}>
                    <sphereGeometry args={[hr * 0.045, 8, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                )}
                <mesh position={[0, hr * 0.26, 0]} rotation={[0, 0, s * (config.eyes === "narrow" ? -0.25 : 0.1)]}>
                  <boxGeometry args={[hr * 0.3, hr * 0.05, hr * 0.05]} />
                  {hairMat}
                </mesh>
              </group>
            ))}
            {[1, -1].map((s) => (
              <mesh key={`c${s}`} position={[s * hr * 0.55, -hr * 0.2, hr * 0.78]} scale={[1, 0.6, 0.3]}>
                <sphereGeometry args={[hr * 0.14, 10, 10]} />
                <meshStandardMaterial color="#f29a9a" transparent opacity={0.55} />
              </mesh>
            ))}
            <mesh position={[0, -hr * 0.12, hr * 0.97]} scale={[0.8, 1, 0.8]}>
              <sphereGeometry args={[hr * 0.08, 10, 10]} />
              {skin}
            </mesh>
            {config.mouth === "smile" && (
              <mesh position={[0, -hr * 0.38, hr * 0.88]} rotation={[0.2, 0, Math.PI]}>
                <torusGeometry args={[hr * 0.16, hr * 0.03, 8, 16, Math.PI]} />
                <meshStandardMaterial color="#b8505a" />
              </mesh>
            )}
            {config.mouth === "neutral" && (
              <mesh position={[0, -hr * 0.4, hr * 0.9]}>
                <boxGeometry args={[hr * 0.26, hr * 0.04, hr * 0.04]} />
                <meshStandardMaterial color="#b8505a" />
              </mesh>
            )}
            {config.mouth === "open" && (
              <mesh position={[0, -hr * 0.4, hr * 0.88]} scale={[1, 0.8, 0.4]}>
                <sphereGeometry args={[hr * 0.12, 12, 12]} />
                <meshStandardMaterial color="#7a2a35" />
              </mesh>
            )}
            <Hair style={config.hair} r={hr} mat={hairMat} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Hair({ style, r, mat }: { style: AvatarConfig["hair"]; r: number; mat: React.ReactNode }) {
  const cap = (
    <mesh castShadow rotation={[-0.45, 0, 0]} position={[0, r * 0.06, -r * 0.04]}>
      <sphereGeometry args={[r * 1.08, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      {mat}
    </mesh>
  );
  const fringe = (
    <mesh castShadow position={[0, r * 0.62, r * 0.6]} rotation={[0.6, 0, 0]} scale={[1.3, 0.35, 0.6]}>
      <sphereGeometry args={[r * 0.6, 16, 12]} />
      {mat}
    </mesh>
  );
  switch (style) {
    case "long":
      return (
        <group>
          {cap}
          {fringe}
          <mesh castShadow position={[0, -r * 0.65, -r * 0.35]} scale={[1, 1, 0.55]}>
            <capsuleGeometry args={[r * 0.95, r * 1.4, 8, 20]} />
            {mat}
          </mesh>
        </group>
      );
    case "ponytail":
      return (
        <group>
          {cap}
          {fringe}
          <mesh position={[0, r * 0.35, -r * 1.0]}>
            <sphereGeometry args={[r * 0.28, 12, 12]} />
            {mat}
          </mesh>
          <mesh castShadow position={[0, -r * 0.4, -r * 1.2]} rotation={[0.25, 0, 0]}>
            <capsuleGeometry args={[r * 0.26, r * 1.3, 6, 12]} />
            {mat}
          </mesh>
        </group>
      );
    case "bob":
      return (
        <group>
          {cap}
          {fringe}
          <mesh castShadow position={[0, -r * 0.15, -r * 0.12]}>
            <cylinderGeometry args={[r * 1.1, r * 1.15, r * 0.9, 28, 1, true, Math.PI * 0.72, Math.PI * 1.56]} />
            {mat}
          </mesh>
        </group>
      );
    case "spiky":
      return (
        <group>
          {cap}
          {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
            <mesh key={i} castShadow position={[x * r, r * 0.95, r * 0.1 - i * 0.02]} rotation={[0.3, 0, -x * 0.6]}>
              <coneGeometry args={[r * 0.25, r * 0.6, 8]} />
              {mat}
            </mesh>
          ))}
          {fringe}
        </group>
      );
    default:
      return (
        <group>
          {cap}
          {fringe}
        </group>
      );
  }
}
