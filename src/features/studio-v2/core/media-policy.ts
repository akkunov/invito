export const MAX_UPLOAD_BYTES=20*1024*1024;
export const MAX_IMAGE_SIDE=4096;
export const MAX_DECODE_PIXELS=32_000_000;
export type SafeImageMime="image/png"|"image/jpeg"|"image/webp"|"image/svg+xml";
export function detectImage(bytes:Uint8Array):SafeImageMime|null{
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return "image/png";
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return "image/jpeg";
 if(bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==="RIFF"&&String.fromCharCode(...bytes.subarray(8,12))==="WEBP")return "image/webp";
 const prefix=new TextDecoder().decode(bytes.subarray(0,1024)).replace(/^\uFEFF/,"").trimStart();
 if(/^<svg(?:\s|>)/i.test(prefix)||/^<\?xml[^?]*\?>\s*<svg(?:\s|>)/i.test(prefix))return "image/svg+xml";
 return null;
}
export function boundedSize(width:number,height:number){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width*height>MAX_DECODE_PIXELS)throw Error("Image dimensions exceed limit");
 const k=Math.min(1,MAX_IMAGE_SIDE/Math.max(width,height));return {width:Math.max(1,Math.round(width*k)),height:Math.max(1,Math.round(height*k))};
}
// Restrictive SVG subset intentionally rejects style sheets, links, images, filters,
// SMIL, scripts, event attributes, namespaces other than SVG and external URLs.
export const SVG_ELEMENTS=new Set(["svg","g","path","rect","circle","ellipse","line","polyline","polygon","title","desc"]);
export const SVG_ATTRIBUTES=new Set(["xmlns","viewBox","width","height","x","y","x1","x2","y1","y2","cx","cy","r","rx","ry","d","points","fill","fill-opacity","fill-rule","stroke","stroke-width","stroke-opacity","stroke-linecap","stroke-linejoin","stroke-dasharray","opacity","transform","preserveAspectRatio"]);
export function safeSvgAttribute(name:string,value:string):boolean{
 if(!SVG_ATTRIBUTES.has(name)||value.length>100000||/url\s*\(|javascript:|data:|@import|[<>]/i.test(value))return false;
 if(name==="xmlns")return value==="http://www.w3.org/2000/svg";
 return true;
}
export function validateSvgSource(source:string){
 if(source.length>1_000_000||/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source))throw Error("Unsafe SVG source");
}
