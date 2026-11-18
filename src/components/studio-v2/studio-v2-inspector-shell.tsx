"use client";
import type {ReactNode} from "react";
import {StudioIcon,type StudioIconName} from "./studio-icon";
export type InspectorTab="design"|"animation"|"responsive"|"canvas";
const tabs:readonly {id:InspectorTab;label:string;icon:StudioIconName}[]=[{id:"design",label:"Дизайн",icon:"shape"},{id:"animation",label:"Анимация",icon:"animation"},{id:"responsive",label:"Адаптив",icon:"responsive"},{id:"canvas",label:"Холст",icon:"frame"}];
export function InspectorTabs({value,onChange}:{value:InspectorTab;onChange:(tab:InspectorTab)=>void}){
 return <div className="v2-inspector-tabs" role="group" aria-label="Режим свойств">{tabs.map(t=><button key={t.id} type="button" aria-pressed={value===t.id} onClick={()=>onChange(t.id)} title={t.label}><StudioIcon name={t.icon}/><span>{t.label}</span></button>)}</div>;
}
export function InspectorPanel({active,children,label}:{active:boolean;children:ReactNode;label:string}){
 return <div className="v2-inspector-panel" hidden={!active} aria-label={label}>{children}</div>;
}
export function InspectorGroup({title,children,defaultOpen=false,icon}:{title:string;children:ReactNode;defaultOpen?:boolean;icon?:StudioIconName}){
 return <details className="v2-inspector-group" open={defaultOpen||undefined}><summary>{icon&&<StudioIcon name={icon}/>}<span>{title}</span><StudioIcon className="v2-group-chevron" name="chevron" size={14}/></summary><div className="v2-group-body">{children}</div></details>;
}
