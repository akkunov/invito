"use client";
import Image from "next/image";
import {motionTracks} from "@/features/studio-v2/core/motion-engine.ts";
import {useStudioMotion,type MotionPlayback} from "./use-studio-motion";
import {appearanceCss,maskCss,contentTransform} from "@/features/studio-v2/core/appearance.ts";
import {InvitationBlockView} from "./studio-v2-invitation-block";
import type {GuestMode} from "@/features/studio-v2/core/invitation-behavior.ts";
import { memo, useMemo, useLayoutEffect, useRef, type CSSProperties } from "react";
import type { TextNode, TextStyle } from "@/features/studio-v2/core/rich-text-engine.ts";
import type { ProjectDocumentV2, ProjectNodeV2 } from "@/features/studio-v2/core/document.schema.ts";

const fonts: Record<string, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "Arial, Helvetica, sans-serif",
};
export function textRunStyle(style:TextStyle):CSSProperties{
 return {fontFamily:fonts[style.fontFamily],fontSize:style.fontSize,fontWeight:style.fontWeight,fontStyle:style.italic?"italic":"normal",textDecoration:[style.underline?"underline":"",style.strike?"line-through":""].filter(Boolean).join(" "),color:style.color};
}
export function TextRuns({node,editorial=false,heritage=false}:{node:TextNode;editorial?:boolean;heritage?:boolean}){
 return <>{node.runs.map((run,index)=><span key={index} style={{...textRunStyle(run.style),...(heritage&&run.style.fontFamily==="serif"?{fontFamily:"var(--v2-invitation-serif, var(--font-display)), Georgia, serif"}:editorial&&run.style.fontFamily==="sans"?{fontFamily:"var(--font-ui), Arial, sans-serif"}:{})}}>{run.text}</span>)}{node.runs.map(r=>r.text).join("").endsWith("\n")&&<span aria-hidden="true">{"\u200b"}</span>}</>;
}
function TextContent({node,onMeasure,editorial,heritage}:{node:TextNode;editorial:boolean;heritage:boolean;onMeasure?:(id:string,height:number)=>void}){
 const ref=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const el=ref.current;if(!el||!node.autoHeight||!onMeasure)return;
  const measure=()=>onMeasure(node.id,Math.max(1,el.offsetHeight));
  measure();const observer=new ResizeObserver(measure);observer.observe(el);
  return()=>observer.disconnect();
 },[node.id,node.autoHeight,onMeasure]);
 return <div ref={ref} style={{width:"100%",fontSize:editorial?node.runs[0].style.fontSize:undefined,fontFamily:heritage?(node.runs[0].style.fontFamily==="serif"?"var(--v2-invitation-serif, var(--font-display)), Georgia, serif":"var(--font-ui), Arial, sans-serif"):undefined,whiteSpace:"pre-wrap",overflowWrap:"anywhere",lineHeight:node.lineHeight??1.14,letterSpacing:node.letterSpacing??0}}><TextRuns node={node} editorial={editorial} heritage={heritage}/></div>;
}
export type ArtboardTextOptions={motionPlayback?:MotionPlayback;guest?:GuestMode;mediaUrls?:Readonly<Record<string,string>>;editingId?:string|null;onMeasure?:(id:string,height:number)=>void;renderEditor?:(node:TextNode)=>React.ReactNode};
function nodeStyle(node: ProjectNodeV2): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    left: node.x, top: node.y,
    width: node.width, height: node.height,
    opacity: node.opacity,
    transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
    transformOrigin: "center",
    pointerEvents: node.locked ? "none" : "auto",
    ...appearanceCss(node),
  };
  return base;
}
function renderNode(document: ProjectDocumentV2, id: string, options:ArtboardTextOptions): React.ReactNode {
  const node = document.nodes[id];
  if (!node || !node.visible) return null;
  const style = nodeStyle(node);
  switch (node.type) {
    case "frame":
      return <div key={id} data-studio-node={id} style={{
        ...style,
        overflow: node.clip || (node.visual?.corners && Object.values(node.visual.corners).some(r=>r>0)) ? "hidden" : "visible",
      }}>{node.children.map(child => renderNode(document, child,options))}</div>;
    case "text":
      return <div key={id} data-studio-node={id} style={{
        ...style,textAlign:node.textAlign,display:"flex",alignItems:node.autoHeight?"flex-start":"center",
        justifyContent:node.textAlign==="left"?"flex-start":node.textAlign==="right"?"flex-end":"center",
        whiteSpace:"pre-wrap",overflowWrap:"anywhere",lineHeight:node.lineHeight??1.14,letterSpacing:node.letterSpacing??0,
      }}>
        <div style={{width:"100%",visibility:options.editingId===id?"hidden":"visible"}}><TextContent node={node} editorial={!!document.presentation} heritage={document.presentation==="heritage"||document.presentation==="gilded"} onMeasure={options.onMeasure}/></div>
        {options.editingId===id&&options.renderEditor?.(node)}
      </div>;
    case "image": {
      const asset = document.assets[node.assetId];
      if (!asset) return null;
      const path = asset.storageKey.startsWith("/images/") ? `${process.env.NEXT_PUBLIC_PAGES_BASE_PATH ?? ""}${asset.storageKey}` : options.mediaUrls?.[asset.storageKey];
      return <div key={id} data-studio-node={id} style={{ ...style, overflow: "hidden",clipPath:maskCss(node) }}>
        {path?<Image unoptimized draggable={false} src={path} alt={asset.decorative?"":asset.name} aria-hidden={asset.decorative||undefined}
          fill loading={!!document.presentation&&!asset.decorative&&node.parentId===document.pages[0].rootNodeId?"eager":undefined}
          sizes={document.presentation?"(max-width: 600px) 100vw, 590px":"(max-width: 900px) 300px, 500px"}
          style={{ objectFit: asset.decorative?"fill":node.fit, objectPosition: `${(node.visual?.imageCrop?.x??node.focalX) * 100}% ${(node.visual?.imageCrop?.y??node.focalY) * 100}%`,transform:contentTransform(node),transformOrigin:`${(node.visual?.imageCrop?.x??node.focalX)*100}% ${(node.visual?.imageCrop?.y??node.focalY)*100}%` }}/>:<div style={{background:"#e9e9e9",width:"100%",height:"100%",display:"grid",placeItems:"center",fontSize:18}}>Ресурс недоступен</div>}
      </div>;
    }
    case "widget":
      return <div key={id} data-studio-node={id} style={{...style,overflow:"hidden",pointerEvents:options.guest&&options.guest.mode!=="studio"?"auto":style.pointerEvents}}><InvitationBlockView node={node} document={document} guest={options.guest??{mode:"studio"}} mediaUrls={options.mediaUrls} onMeasure={options.onMeasure}/></div>;
    case "shape":
      return <div key={id} data-studio-node={id} style={{
        ...style, ...(node.visual?.stroke===undefined&&node.stroke?{border:`${node.strokeWidth}px solid ${node.stroke}`,outline:undefined,outlineOffset:undefined}:{}), transform:`rotate(${node.rotation}deg) ${contentTransform(node)}`,
        clipPath: maskCss(node) ?? (node.shape === "triangle" ? "polygon(50% 0,100% 100%,0 100%)"
          : node.shape === "star" ? "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
          : node.shape === "heart" ? "polygon(50% 92%,6% 50%,0 28%,5% 11%,22% 3%,40% 12%,50% 26%,60% 12%,78% 3%,95% 11%,100% 28%,94% 50%)"
          : undefined),
      }}/>;
  }
}
export const StudioV2Artboard=memo(function StudioV2Artboard({ document, rootNodeId, ...options }: { document: ProjectDocumentV2; rootNodeId: string } & ArtboardTextOptions) {
  const root = document.nodes[rootNodeId];
  const motionRef=useRef<HTMLDivElement>(null);
  const hasMotion=!!options.motionPlayback;
  const tracks=useMemo(()=>{const pageId=document.pages.find(p=>p.rootNodeId===rootNodeId)?.id;return hasMotion&&pageId?motionTracks(document,pageId):[];},[document,rootNodeId,hasMotion]);
  useStudioMotion(motionRef,tracks,options.motionPlayback);
  if (!root || root.type !== "frame") return null;
  return <div ref={motionRef} data-motion-root={rootNodeId} className="studio-v2-artboard-content" data-artboard-presentation={document.presentation} style={{
    width: root.width, height: root.height, position: "relative", ...appearanceCss(root),
    ...(document.presentation==="heritage"?{backgroundImage:`url("${process.env.NEXT_PUBLIC_PAGES_BASE_PATH??""}/images/kyrgyz-heritage/paper-texture.webp")`}:{}),
    ...(document.presentation==="gilded"?{"--v2-gilded-timeline-marker":`url("${process.env.NEXT_PUBLIC_PAGES_BASE_PATH??""}/images/ak-orgo/timeline-marker.svg")`}:{}),
    overflow: root.clip || (root.visual?.corners && Object.values(root.visual.corners).some(r=>r>0)) ? "hidden" : "visible",
  } as CSSProperties}>
    {root.children.map(id => renderNode(document, id, options))}
  </div>;
});
