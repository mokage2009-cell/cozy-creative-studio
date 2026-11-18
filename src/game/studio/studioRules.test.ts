import { describe, expect, it } from "vitest";
import { homePath, homeZone, studioEditingAllowed, walkStep, STUDIO_POINT } from "../logic";
import { sampleStudioMotion } from "../vrm/vrmPose";
import { motionSchema } from "./motionSchema";
describe("creative studio rules", () => {
 it("editors open only inside the studio", () => {
  expect(studioEditingAllowed(2, false)).toBe(false);
  expect(studioEditingAllowed(-6.5, false)).toBe(false);
  expect(studioEditingAllowed(STUDIO_POINT[1], false)).toBe(true);
 });
 it("visitors cannot use studio editors", () => expect(studioEditingAllowed(-10.5,true)).toBe(false));
 it("walks through the connecting hallway in both directions", () => {
  expect(homePath([3,2],STUDIO_POINT)).toEqual([[0,-3.5],[0,-5.5],[0,-8.5],[0,-10.5]]);
  expect(homePath(STUDIO_POINT,[3,2])).toEqual([[0,-8.5],[0,-5.5],[0,-3.5],[3,2]]);
 });
 it("walking reaches studio without teleportation or overshoot", () => {
  let position:[number,number]=[.5,2.5];const path=homePath(position,STUDIO_POINT);
  for(const target of path){for(let i=0;i<600;i++){position=walkStep(position,target,1/60);if(Math.hypot(position[0]-target[0],position[1]-target[1])<.001)break;}}
  expect(position).toEqual(STUDIO_POINT);expect(homeZone(position[1])).toBe("studio");
 });
 it("supports continuous 体育座り sequences",()=>{
  const frames=motionSchema.parse({name:"体育座り",frames:[{pose:"stand",duration:1,bend:0,arm:0},{pose:"knees",duration:3,bend:0,arm:0}]}).frames;
  expect(sampleStudioMotion(frames,2).lt).toBe(-2.15);
  const before=sampleStudioMotion(frames,1.001),after=sampleStudioMotion(frames,1.01);
  expect(Math.abs(after.lt-before.lt)).toBeLessThan(.01);
 });
 it("rejects invalid AI pose durations",()=>expect(motionSchema.safeParse({name:"体育座り",frames:[{pose:"knees",duration:0,bend:0,arm:0},{pose:"stand",duration:1,bend:0,arm:0}]}).success).toBe(false));
});