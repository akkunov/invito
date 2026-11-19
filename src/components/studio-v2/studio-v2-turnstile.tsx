"use client";
import {useEffect,useRef} from "react";

type TurnstileApi={
  render:(element:HTMLElement,options:{
    sitekey:string;callback:(token:string)=>void;
    "expired-callback":()=>void;"error-callback":()=>void;
  })=>string;
  remove:(widgetId:string)=>void;
  reset:(widgetId:string)=>void;
};
declare global {interface Window {turnstile?:TurnstileApi}}

/** Explicit Cloudflare widget rendering. No third-party React SDK or token persistence. */
export function StudioTurnstile({siteKey,onToken,resetKey}:{siteKey:string;onToken:(token:string)=>void;resetKey:number}){
  const host=useRef<HTMLDivElement>(null);
  const handler=useRef(onToken);
  const widget=useRef<string|null>(null);
  handler.current=onToken;

  useEffect(()=>{
    let active=true;
    const node=host.current;
    if(!node)return;
    function mount(){
      if(!active||!node||!window.turnstile||widget.current)return;
      widget.current=window.turnstile.render(node,{
        sitekey:siteKey,callback:token=>handler.current(token),
        "expired-callback":()=>handler.current(""),
        "error-callback":()=>handler.current(""),
      });
    }
    let script=document.querySelector<HTMLScriptElement>('script[data-invito-turnstile="true"]');
    if(!script){
      script=document.createElement("script");
      script.dataset.invitoTurnstile="true";
      script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async=true;
      document.head.appendChild(script);
    }
    script.addEventListener("load",mount);
    mount();
    return()=>{
      active=false;script?.removeEventListener("load",mount);
      if(widget.current&&window.turnstile)window.turnstile.remove(widget.current);
      widget.current=null;
    };
  },[siteKey]);

  useEffect(()=>{
    if(resetKey>0&&widget.current&&window.turnstile)window.turnstile.reset(widget.current);
  },[resetKey]);
  return <div ref={host} className="v2-guest-turnstile" aria-label="Подтверждение защиты от спама"/>;
}
