import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";
import type {MotionSpec} from "./motion.schema.ts";
import {defaultMotion,motionSchema} from "./motion.schema.ts";
import type {StudioCommand} from "./command-engine.ts";
export const easingCss:Record<MotionSpec["easing"],string>={linear:"linear",ease:"ease","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out",smooth:"cubic-bezier(.22,1,.36,1)"};
export type MotionTrack={id:string;pageId:string;name:string;spec:MotionSpec;opacity:number;canReveal:boolean};
export function motionTracks(doc:ProjectDocumentV2,pageId?:string):MotionTrack[]{
 const tracks:MotionTrack[]=[];
 function visit(id:string,page:string){
  const n=doc.nodes[id];if(!n||!n.visible)return;
  if(n.motion){const name=n.layerName??(n.type==="frame"?n.name:n.type==="text"?n.runs.map(r=>r.text).join("").slice(0,45):n.type==="image"?doc.assets[n.assetId]?.name??"Фото":n.type==="widget"?n.block.title[doc.locale]:"Фигура");
   const canReveal=!n.visual?.mask||n.visual.mask==="rectangle";
   tracks.push({id,pageId:page,name,spec:n.motion,opacity:n.opacity,canReveal:canReveal&&!(n.type==="shape"&&["triangle","star","heart"].includes(n.shape))});
  }
  if(n.type==="frame")n.children.forEach(child=>visit(child,page));
 }
 for(const p of doc.pages)if(!pageId||pageId===p.id)visit(p.rootNodeId,p.id);
 return tracks;
}
export function timelineLength(tracks:readonly MotionTrack[]){return Math.max(1000,...tracks.map(t=>t.spec.delay+t.spec.duration));}
export function trackProgress(spec:MotionSpec,ms:number){return Math.max(0,Math.min(1,(ms-spec.delay)/spec.duration));}
export function scrollProgress(top:number,height:number,viewportHeight:number){
 if(!Number.isFinite(top)||height<0||viewportHeight<=0)return .5;
 return Math.max(0,Math.min(1,(viewportHeight-top)/(viewportHeight+height)));
}
export function parallaxOffset(spec:MotionSpec,progress:number){return (Math.max(0,Math.min(1,progress))-.5)*2*spec.distance;}
type MotionFrame={opacity?:number;translate?:string;scale?:string;clipPath?:string};
/** Individual CSS transform properties compose with the authored rotate/flip transform. */
export function motionFrames(track:MotionTrack):MotionFrame[]{
 const {spec:m,opacity,canReveal}=track;
 switch(m.preset){
 case "fade":return [{opacity:0},{opacity}];
 case "slide-up":return [{opacity:0,translate:`0px ${m.distance}px`},{opacity,translate:"0px 0px"}];
 case "slide-left":return [{opacity:0,translate:`${m.distance}px 0px`},{opacity,translate:"0px 0px"}];
 case "scale":return [{opacity:0,scale:String(m.fromScale)},{opacity,scale:"1"}];
 case "reveal":return canReveal?[{clipPath:"inset(100% 0 0 0)",opacity:0},{clipPath:"inset(0% 0 0 0)",opacity}]:[{opacity:0},{opacity}];
 case "parallax":return [{translate:`0px ${-m.distance}px`},{translate:`0px ${m.distance}px`}];
 }
}
export function staggerCommands(doc:ProjectDocumentV2,ids:readonly string[],interval:number,start:number,preset:MotionSpec["preset"]="slide-up"):StudioCommand[]{
 if(!Number.isInteger(interval)||interval<0||interval>3000||!Number.isInteger(start)||start<0||start>20000||preset==="parallax")throw Error("Invalid stagger timing");
 const unique=[...new Set(ids)];if(!unique.length||start+(unique.length-1)*interval>20000)throw Error("Sequence exceeds the delay limit");
 return unique.map((id,i)=>{const n=doc.nodes[id];if(!n||n.locked)throw Error("Choose writable layers");
  const motion=motionSchema.parse({...defaultMotion,...n.motion,preset,trigger:"viewport",delay:start+i*interval});
  return {kind:"updateNode",id,changes:{motion}};
 });
}
export function motionForPreset(preset:MotionSpec["preset"],previous:MotionSpec=defaultMotion):MotionSpec{
 return motionSchema.parse({...previous,preset,trigger:preset==="parallax"?"scroll":previous.trigger==="scroll"?"viewport":previous.trigger});
}
