import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3, type Group } from 'three';
import { ArrowLeft, MessageCircle, Sofa, Home, Sun, ChevronRight, Camera, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ACTIONS, DEFAULT_AVATAR, DEFAULT_FURNITURE } from '../catalog';
import { avatarDims, parseChat, planCommand, homePath, homeZone, STUDIO_POINT, studioEditingAllowed, walkStep, type MovePlan } from '../logic';
import { useGame } from '../store';
import type { AvatarCommand, AvatarConfig, FurnitureItem, Pose, StudioFrame } from '../types';
import { AvatarModel } from './Avatar3D';
import { Furniture3D } from './Furniture3D';
import { ChatPanel, InventoryPanel } from '../ui/HomePanels';
import { StudioPanel } from '../studio/StudioPanel';
import { RoomArchitecture, scenePalette } from './RoomArchitecture';

type Cmd=AvatarCommand & {id:number};
function CameraRig({zone,reset}: {zone:string;reset:number}) {
 const controls=useRef<React.ComponentRef<typeof OrbitControls>>(null);const {camera,size}=useThree();const moving=useRef(true);
 useEffect(()=>{moving.current=true;},[zone,reset,size.width]);
 useFrame((_,delta)=>{
  if(!moving.current||!controls.current)return;
  const studio=zone==='studio',mobile=size.width<600;
  const pos=new Vector3(studio?6:12,studio?5:10,studio?-7:14);
  const target=new Vector3(studio?(mobile?0:1.2):-.4,studio?(mobile?-.8:1):0,studio?-11:-1.8);
  if(mobile)pos.sub(target).multiplyScalar(studio?1.18:1.3).add(target);
  const alpha=1-Math.exp(-3*Math.min(delta,.05));camera.position.lerp(pos,alpha);controls.current.target.lerp(target,alpha);controls.current.update();
  if(camera.position.distanceTo(pos)<.03)moving.current=false;
 });
 return <OrbitControls ref={controls} enablePan={false} minDistance={4} maxDistance={35} maxPolarAngle={1.4} onStart={()=>{moving.current=false;}}/>;
}
function AvatarController({cmd,items,config,onZone,motion}: {cmd:Cmd|null;items:FurnitureItem[];config:AvatarConfig;onZone:(z:number)=>void;motion:StudioFrame[]|null}) {
 const g=useRef<Group>(null);const plan=useRef<MovePlan|null>(null);const path=useRef<[number,number][]>([]);const zone=useRef('living');const [pose,setPose]=useState<Pose>('stand');const dims=useMemo(()=>avatarDims(config),[config]);
 const step=(dt:number)=>{const grp=g.current,p=plan.current,target=path.current[0];if(!grp||!p||!target)return;
  const [x,z]=walkStep([grp.position.x,grp.position.z],target,dt);const dx=x-grp.position.x,dz=z-grp.position.z;grp.position.set(x,0,z);grp.rotation.y=Math.atan2(dx,dz);
  const next=homeZone(z);if(next!==zone.current){zone.current=next;onZone(z);}
  if(Math.hypot(x-target[0],z-target[1])<.02){path.current.shift();if(!path.current.length){grp.position.set(...p.pos);grp.rotation.y=p.rotY;setPose(p.pose);plan.current=null;onZone(p.pos[2]);}}
 };
 useEffect(()=>{if(!cmd||!g.current)return;const p=planCommand(cmd,items,dims.legLen);plan.current=p;path.current=homePath([g.current.position.x,g.current.position.z],p.approach);setPose('walk');},[cmd,items,dims.legLen]);
 useEffect(()=>{if(!import.meta.env.DEV)return;const debug={state:()=>({position:g.current?.position.toArray(),zone:zone.current}),sim:(seconds:number)=>{for(let i=0;i<seconds*60;i++)step(1/60);}};Object.assign(window,{__home:debug});return()=>{Object.assign(window,{__home:undefined});};});
 useFrame((_,dt)=>step(Math.min(dt,.05)));
 return <group ref={g} position={[.5,0,2.5]}><AvatarModel config={config} pose={pose} motion={pose==='walk'?null:motion}/></group>;
}
export function HomeView(){
 const s=useGame();const readOnly=!!s.visiting;const items=readOnly?DEFAULT_FURNITURE:s.furniture;const avatar=readOnly?DEFAULT_AVATAR:s.avatar;
 const [cmd,setCmd]=useState<Cmd|null>(null),[zone,setZone]=useState('living'),[panel,setPanel]=useState<'chat'|'items'|null>(null),[selected,setSelected]=useState<string|null>(null),[menu,setMenu]=useState<string|null>(null),[log,setLog]=useState<{who:'me'|'avatar';text:string}[]>([]),[motion,setMotion]=useState<StudioFrame[]|null>(null),[reset,setReset]=useState(0),[ready,setReady]=useState(false);
 const colors=useMemo(scenePalette,[]);const canEdit=studioEditingAllowed(zone==='studio'?-10:0,readOnly);
 const run=(c:AvatarCommand)=>{setCmd({...c,id:Date.now()+Math.random()});return c.say??'了解！';};
 const goStudio=()=>{if(readOnly)return;setPanel(null);setMenu(null);run({targetPoint:STUDIO_POINT,pose:'stand'});};
 const goLiving=()=>{setMotion(null);run({targetPoint:[.5,2],pose:'stand'});};
 const floor=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta>6||readOnly)return;setMenu(null);if(panel==='items'&&selected){if(e.point.z>=-5)s.moveItem(selected,e.point.x,e.point.z);return;}const z=e.point.z;if(z<-5)goStudio();else{setMotion(null);run({targetPoint:[Math.max(-5.4,Math.min(5.4,e.point.x)),Math.max(-4.4,Math.min(4.4,z))],pose:'stand'});}};
 const menuItem=items.find(i=>i.uid===menu);
 return <div className="home-screen absolute inset-0" data-scene-ready={ready||undefined} data-zone={zone}>
  <Canvas shadows camera={{position:[12,10,14],fov:40}} dpr={[1,1.5]} onCreated={()=>setReady(true)}>
   <color attach="background" args={[colors['floor']]}/><ambientLight intensity={.8}/><hemisphereLight args={[colors['light'],colors['sage'],1]}/>
   <directionalLight castShadow position={[-4,9,3]} intensity={2} color={colors['light']} shadow-mapSize={[1024,1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-normalBias={.04}/>
   <Environment resolution={32}><Lightformer intensity={1.5} position={[0,6,0]} scale={[12,12,1]}/></Environment>
   <RoomArchitecture onFloor={floor} onStudio={goStudio} onLiving={goLiving} studioActive={zone==='studio'}/>
   {items.filter(i=>i.placed).map(it=><group key={it.uid} position={[it.x,0,it.z]} rotation={[0,it.rotY,0]} onClick={e=>{e.stopPropagation();if(e.delta>6||readOnly)return;if(panel==='items')setSelected(it.uid);else setMenu(it.uid);}}><Furniture3D item={it} plantScale={s.plant.scale} selected={selected===it.uid}/></group>)}
   {menuItem&&<Html position={[menuItem.x,1.7,menuItem.z]} center zIndexRange={[25,0]}><div className="panel p-2 flex gap-2">{ACTIONS[menuItem.type].map(a=><Button key={a.id} size="sm" onClick={()=>{setMenu(null);run({targetUid:menuItem.uid,pose:a.pose,say:a.label});}}>{a.label}</Button>)}</div></Html>}
   <AvatarController cmd={cmd} items={items} config={avatar} motion={canEdit?motion:null} onZone={z=>{setZone(homeZone(z));if(z<-8)setPanel(null);}}/>
   <CameraRig zone={zone} reset={reset}/>
  </Canvas>
  <header className="home-heading"><div className="home-emblem"><Home size={21}/></div><div><span className="eyebrow">POCKET TOWN</span><h1>わたしの自宅</h1></div><div className="home-breadcrumb"><span>HOME</span><ChevronRight size={13}/><span>{zone==='studio'?'クリエイティブ・スタジオ':'リビング'}</span></div></header>
  <div className="room-status"><Sun size={17}/><span>心地よい昼下がり</span><span className="status-dot"/></div>
  <div className="view-tools"><Button variant="tool" size="icon" title="視点を戻す" aria-label="視点を戻す" onClick={()=>setReset(r=>r+1)}><RotateCcw/></Button><Button variant="tool" size="icon" title="写真を保存" aria-label="写真を保存" onClick={()=>s.notify('写真は端末のスクリーンショットで保存できます')}><Camera/></Button></div>
  {readOnly&&<div className="visit-banner">{s.visiting?.ownerName}さんの家 · 閲覧専用</div>}
  {canEdit&&<StudioPanel onMotion={setMotion} onReturn={goLiving}/>}
  <div className="home-bottom">
   {panel==='chat'&&<ChatPanel log={log} onClose={()=>setPanel(null)} onSend={t=>{const c=parseChat(t,items);const say=run(c);setLog(l=>[...l,{who:'me',text:t},{who:'avatar',text:say}]);}}/>}
   {panel==='items'&&<InventoryPanel selected={selected} onSelect={setSelected} onClose={()=>{setPanel(null);setSelected(null);}}/>}
   <nav className="home-dock" aria-label="自宅の操作"><Button variant="dock" onClick={s.exitHome}><ArrowLeft/><span>街へ戻る</span></Button><div className="dock-divider"/>{!readOnly&&<><Button variant="dock" aria-pressed={panel==='chat'} onClick={()=>setPanel(panel==='chat'?null:'chat')}><MessageCircle/><span>チャット</span></Button><Button variant="dock" aria-pressed={panel==='items'} onClick={()=>setPanel(panel==='items'?null:'items')}><Sofa/><span>家具配置</span></Button></>}</nav>
  </div>
 </div>;
}
