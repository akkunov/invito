import type {ProjectNodeV2} from "./document.schema.ts";
import type {VisualProperties,Corners} from "./appearance.schema.ts";
export const ZERO_CORNERS:Corners={topLeft:0,topRight:0,bottomRight:0,bottomLeft:0};
export const uniformCorners=(radius:number):Corners=>({topLeft:radius,topRight:radius,bottomRight:radius,bottomLeft:radius});
export function fillCss(fill:VisualProperties["fill"],fallback="transparent"){
 if(!fill)return fallback;if(fill.kind==="none")return "transparent";if(fill.kind==="solid")return fill.color;
 return `linear-gradient(${fill.angle}deg, ${fill.stops.map(s=>s.color+" "+s.position+"%").join(", ")})`;
}
export function radiusCss(node:ProjectNodeV2){
 const c=node.visual?.corners;
 if(node.type==="shape"&&(node.shape==="circle"||node.shape==="ellipse"))return "50%";
 return c?`${c.topLeft}px ${c.topRight}px ${c.bottomRight}px ${c.bottomLeft}px`:undefined;
}
export function appearanceCss(node:ProjectNodeV2){
 const v=node.visual;
 const fallback=node.type==="shape"?node.fill:node.type==="frame"?node.background:"transparent";
 const stroke=v?.stroke===undefined?(node.type==="shape"&&node.stroke?{color:node.stroke,width:node.strokeWidth,style:"solid"}:null):v.stroke;
 const shadow=v?.shadow;
 return {background:fillCss(v?.fill,fallback),borderRadius:radiusCss(node),boxShadow:shadow?`${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}${Math.round(shadow.opacity*255).toString(16).padStart(2,"0")}`:undefined,filter:v?.blur?`blur(${v.blur}px)`:undefined,outline:stroke&&stroke.width?`${stroke.width}px ${stroke.style} ${stroke.color}`:undefined,outlineOffset:stroke&&stroke.width?-stroke.width:undefined};
}
export function maskCss(node:ProjectNodeV2){
 return node.visual?.mask==="ellipse"?"ellipse(50% 50% at 50% 50%)":node.visual?.mask==="diamond"?"polygon(50% 0, 100% 50%, 50% 100%, 0 50%)":undefined;
}
export function contentTransform(node:ProjectNodeV2){
 const v=node.visual,c=v?.imageCrop;
 return `scale(${v?.flipX?-1:1}, ${v?.flipY?-1:1})${node.type==="image"&&c?` scale(${c.zoom})`:""}`;
}
