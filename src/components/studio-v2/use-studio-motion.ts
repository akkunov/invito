"use client";
import {useLayoutEffect,useRef} from "react";
import {easingCss,motionFrames,scrollProgress,type MotionTrack} from "@/features/studio-v2/core/motion-engine.ts";
export type MotionPlayback={mode:"live"}|{mode:"timeline";timeMs:number};
const motionQuery="(prefers-reduced-motion: reduce)";
/** Motion is attached to rendered elements, not the authored document or layout solver. */
export function useStudioMotion(ref:React.RefObject<HTMLDivElement|null>,tracks:readonly MotionTrack[],playback?:MotionPlayback){
 const active=useRef<Array<{animation:Animation;track:MotionTrack}>>([]);
 const time=playback?.mode==="timeline"?playback.timeMs:0;
 const mode=playback?.mode??"off";
 const signature=JSON.stringify(tracks);
 useLayoutEffect(()=>{
  const element=ref.current;if(!element||mode==="off"||!element.animate)return;
  const root:HTMLDivElement=element;
  const list=JSON.parse(signature) as MotionTrack[];if(!list.length)return;
  const media=window.matchMedia(motionQuery);
  const cleanups:Array<()=>void>=[];
  const animations=new Set<Animation>();
  let observer:IntersectionObserver|undefined;
  let raf=0;
  const targetMap=new Map<Element,()=>void>();
  function clear(){
   observer?.disconnect();observer=undefined;targetMap.clear();
   cancelAnimationFrame(raf);raf=0;
   for(const cleanup of cleanups.splice(0))cleanup();
   for(const a of animations)a.cancel();animations.clear();active.current=[];
  }
  function setup(){
   clear();if(media.matches)return;
   const scrollRoot=root.closest<HTMLElement>(".v2-preview-scroll");
   const scrollTarget=scrollRoot??window;
   const page=root.closest<HTMLElement>("[data-preview-page]")??root;
   const elements=new Map<string,HTMLElement>();
   if(root.dataset.motionRoot)elements.set(root.dataset.motionRoot,root);
   root.querySelectorAll<HTMLElement>("[data-studio-node]").forEach(el=>{const id=el.dataset.studioNode;if(id)elements.set(id,el);});
   const scrollAnimations:Array<{animation:Animation;track:MotionTrack}>=[];
   function updateScroll(){
    raf=0;
    const rect=page.getBoundingClientRect(),container=scrollRoot?.getBoundingClientRect();
    const progress=scrollProgress(rect.top-(container?.top??0),rect.height,container?.height??window.innerHeight);
    for(const {animation,track} of scrollAnimations)animation.currentTime=track.spec.delay+track.spec.duration*progress;
   }
   function scheduleScroll(){if(!raf)raf=requestAnimationFrame(updateScroll);}
   if(mode==="live"&&typeof IntersectionObserver!=="undefined")observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const start=targetMap.get(entry.target);if(start){start();observer?.unobserve(entry.target);targetMap.delete(entry.target);}}}},{root:scrollRoot,threshold:0});
   function listen(el:HTMLElement,event:string,fn:EventListener){el.addEventListener(event,fn);cleanups.push(()=>el.removeEventListener(event,fn));}
   for(const track of list){
    const el=elements.get(track.id);if(!el)continue;
    const spec=track.spec;
    const frames=motionFrames(track);
    const timed=()=>{const a=el.animate(frames,{duration:spec.duration,delay:spec.delay,easing:easingCss[spec.easing],fill:"both"});animations.add(a);return a;};
    if(mode==="timeline"||spec.trigger==="scroll"){
     const a=timed();a.pause();a.currentTime=0;
     if(mode==="timeline")active.current.push({animation:a,track});else scrollAnimations.push({animation:a,track});
     continue;
    }
    // Hover/click effects never hide an idle control.
    if(spec.trigger==="hover"||spec.trigger==="click"){
     let current:Animation|undefined;
     const start=()=>{if(current){current.cancel();animations.delete(current);}current=timed();const run=current;run.onfinish=()=>{run.cancel();animations.delete(run);if(current===run)current=undefined;};};
     const event=spec.trigger==="hover"?"pointerenter":"click";
     listen(el,event,start);
     if(spec.trigger==="hover")listen(el,"focusin",start);
     continue;
    }
    const a=timed();a.pause();a.currentTime=0;
    let started=false;
    const start=()=>{if(started)return;started=true;a.play();};
    a.onfinish=()=>{a.cancel();animations.delete(a);};
    // Keyboard navigation must never leave a focused guest control invisible.
    listen(el,"focusin",()=>{started=true;a.cancel();animations.delete(a);observer?.unobserve(el);targetMap.delete(el);});
    if(spec.trigger==="viewport"&&observer){targetMap.set(el,start);observer.observe(el);}else start();
   }
   if(scrollAnimations.length){scrollTarget.addEventListener("scroll",scheduleScroll,{passive:true});window.addEventListener("resize",scheduleScroll,{passive:true});cleanups.push(()=>{scrollTarget.removeEventListener("scroll",scheduleScroll);window.removeEventListener("resize",scheduleScroll);});scheduleScroll();}
   if(mode==="timeline")for(const item of active.current)item.animation.currentTime=Math.max(0,Math.min(item.track.spec.delay+item.track.spec.duration,timeRef.current));
  }
  setup();media.addEventListener("change",setup);
  return()=>{media.removeEventListener("change",setup);clear();};
 },[ref,signature,mode]);
 const timeRef=useRef(time);timeRef.current=time;
 useLayoutEffect(()=>{if(mode==="timeline")for(const {animation,track} of active.current)animation.currentTime=Math.max(0,Math.min(track.spec.delay+track.spec.duration,time));},[mode,time,signature]);
}
