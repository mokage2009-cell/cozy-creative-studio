import { useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { Html, MeshReflectorMaterial, RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { useGame } from '../store';

type SceneColor = 'wall'|'trim'|'wood'|'wood-line'|'sage'|'rose'|'sky'|'light'|'ink'|'floor'|'rug';
export function scenePalette(over: Record<string,string> = {}): Record<SceneColor, string> {
 const css = getComputedStyle(document.documentElement);
  const color = (key: SceneColor) => over[key] ?? css.getPropertyValue(`--scene-${key}`).trim();
  return {wall:color('wall'),trim:color('trim'),wood:color('wood'),'wood-line':color('wood-line'),sage:color('sage'),rose:color('rose'),sky:color('sky'),light:color('light'),ink:color('ink'),floor:color('floor'),rug:color('rug')};
}
const FLOOR_SECTIONS: [number,number,number,number][] = [[0,0,12,10],[0,-6.5,2,3],[0,-11,8,6]];
function Block({position,size,color}: {position:[number,number,number];size:[number,number,number];color:string}) {
 return <RoundedBox position={position} args={size} radius={0.025} smoothness={2} castShadow receiveShadow><meshToonMaterial color={color}/></RoundedBox>;
}
export function RoomArchitecture({onFloor,onStudio,onLiving,studioActive}: {onFloor:(e:ThreeEvent<MouseEvent>)=>void;onStudio:()=>void;onLiving:()=>void;studioActive:boolean}) {
 const over = useGame(s=>s.sceneColors);
 const p = useMemo(()=>scenePalette(over),[over]);
 const wood = useMemo(()=>{
  const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');if(!g)return null;
  g.fillStyle=p['wood'];g.fillRect(0,0,512,512);g.strokeStyle=p['wood-line'];g.lineWidth=2;
  for(let y=0;y<=512;y+=64){g.beginPath();g.moveTo(0,y);g.lineTo(512,y);g.stroke();for(let x=(y%128?128:0);x<512;x+=256){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+64);g.stroke();}}
  for(let i=0;i<100;i++){g.globalAlpha=.12;g.beginPath();const y=(i*47)%512;g.moveTo((i*83)%512,y);g.bezierCurveTo(150,y-2,300,y+3,510,y);g.stroke();}g.globalAlpha=1;
  const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;
 },[p]);
 return <group>
  <mesh position={[0,-.12,0]} receiveShadow><boxGeometry args={[12,.24,10]}/><meshToonMaterial color={p['trim']}/></mesh>
  {FLOOR_SECTIONS.map(([x,z,w,d],i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[x,.002,z]} onClick={onFloor} receiveShadow><planeGeometry args={[w,d]}/><meshToonMaterial map={wood} color={p['light']}/></mesh>)}
  <Block position={[-3.55,1.6,-5]} size={[4.9,3.2,.16]} color={p['wall']}/><Block position={[3.55,1.6,-5]} size={[4.9,3.2,.16]} color={p['wall']}/>
  <Block position={[0,2.95,-5]} size={[2.2,.5,.2]} color={p['wall']}/>
  <Block position={[-6,1.6,0]} size={[.16,3.2,10]} color={p['wall']}/>
  {[-1.1,1.1].map(x=><Block key={x} position={[x,1.35,-5]} size={[.13,2.7,.28]} color={p['trim']}/>)}
  <Block position={[0,2.68,-5]} size={[2.35,.13,.28]} color={p['trim']}/>
  {[-1.1,1.1].map(x=><Block key={x} position={[x,1.5,-6.5]} size={[.13,3,3]} color={p['sage']}/>)}
  <Block position={[0,1.6,-14]} size={[8,3.2,.16]} color={p['wall']}/><Block position={[-4,1.6,-11]} size={[.16,3.2,6]} color={p['sage']}/>
  {!studioActive&&[-2.6,2.6].map(x=><Block key={x} position={[x,1.6,-8]} size={[3,3.2,.13]} color={p['wall']}/>)}
  {/* Tall window and flowing curtains */}
  <Block position={[-3.8,1.9,-4.87]} size={[3.1,2.15,.13]} color={p['trim']}/>
  <mesh position={[-3.8,1.9,-4.77]}><planeGeometry args={[2.9,1.95]}/><meshBasicMaterial color={p['sky']}/></mesh>
  {[-4.5,-3.1].map(x=><Block key={x} position={[x,1.9,-4.74]} size={[.06,1.95,.04]} color={p['light']}/>)}
  <Block position={[-3.8,1.9,-4.71]} size={[2.9,.06,.04]} color={p['light']}/>
  {[-5.5,-2.1].map(x=><group key={x}>{[0,.15,.3].map((d,i)=><mesh key={i} position={[x+d,1.7,-4.58]}><cylinderGeometry args={[.11,.15,2.7,12]}/><meshToonMaterial color={p['light']}/></mesh>)}</group>)}
  <Block position={[-3.8,.82,-4.65]} size={[3.4,.12,.35]} color={p['trim']}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[.4,.012,.7]} receiveShadow><circleGeometry args={[2.45,64]}/><meshToonMaterial color={p['rug']}/></mesh>
  <mesh position={[.4,.009,.7]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.4,2.5,64]}/><meshToonMaterial color={p['sage']}/></mesh>
  <Block position={[-3.55,.12,-4.9]} size={[4.9,.23,.1]} color={p['trim']}/><Block position={[3.55,.12,-4.9]} size={[4.9,.23,.1]} color={p['trim']}/>
  <Block position={[-5.9,.12,0]} size={[.1,.23,10]} color={p['trim']}/>
  {/* Wall-mounted art, shelves, books */}
  <group position={[-5.86,1.9,.4]} rotation={[0,Math.PI/2,0]}>
   <Block position={[0,0,0]} size={[1.25,1.5,.08]} color={p['trim']}/><Block position={[0,0,.05]} size={[1.08,1.32,.03]} color={p['sky']}/>
   <mesh position={[.22,.25,.08]}><circleGeometry args={[.23,32]}/><meshBasicMaterial color={p['light']}/></mesh>
   <mesh position={[0,-.4,.08]}><circleGeometry args={[.53,32]}/><meshBasicMaterial color={p['sage']}/></mesh>
  </group>
  <Block position={[3.8,2,-4.7]} size={[2.7,.1,.4]} color={p['trim']}/>
  {[0,1,2,3,4].map(i=><Block key={i} position={[3+i*.17,2.24,-4.7]} size={[.12,.4,.22]} color={i%2?p['sage']:p['rose']}/>)}
  {/* Mirror, stage and studio illumination */}
  <Block position={[-1.8,1.6,-13.8]} size={[2,2.85,.15]} color={p['trim']}/>
  <mesh position={[-1.8,1.6,-13.7]}><planeGeometry args={[1.8,2.65]}/><MeshReflectorMaterial resolution={256} mirror={.75} mixStrength={1} color={p['sky']} metalness={.65} roughness={.15}/></mesh>
  <mesh position={[0,.08,-10.5]} receiveShadow><cylinderGeometry args={[1.3,1.4,.16,64]}/><meshToonMaterial color={p['light']}/></mesh>
  <mesh position={[0,.17,-10.5]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.18,1.24,64]}/><meshBasicMaterial color={p['sage']}/></mesh>
  {[-3,3].map(x=><group key={x}><Block position={[x,1.4,-12]} size={[.06,2.8,.06]} color={p['ink']}/><Block position={[x,2.65,-12]} size={[.7,.8,.1]} color={p['light']}/><pointLight position={[x,2.6,-11.8]} color={p['light']} intensity={3} distance={7}/></group>)}
  <Html position={[0,2.8,-5]} center zIndexRange={[15,0]}><Button variant="tool" className="door-label" onClick={onStudio}>CREATIVE STUDIO <ArrowUpRight/></Button></Html>
  <Html position={[0,2.8,-8]} rotation={[0,Math.PI,0]} center zIndexRange={[15,0]}><Button variant="tool" className="door-label" onClick={onLiving}>LIVING ROOM</Button></Html>
  <mesh position={[0,1.3,-5]} onClick={e=>{e.stopPropagation();onStudio();}}><planeGeometry args={[2,2.6]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 </group>;
}
