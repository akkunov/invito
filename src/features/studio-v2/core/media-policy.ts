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

/** Reject oversized raster dimensions before invoking a native decoder. */
export function rasterDimensions(bytes:Uint8Array,mime:SafeImageMime):{width:number;height:number}{
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const fail=():never=>{throw Error("Invalid raster header")};
 if(mime==="image/png"){
  if(bytes.length<24||v.getUint32(12)!==0x49484452)return fail();
  return {width:v.getUint32(16),height:v.getUint32(20)};
 }
 if(mime==="image/jpeg"){
  let i=2;
  while(i+3<bytes.length){
   if(bytes[i++]!==255)return fail();
   while(bytes[i]===255)i++;
   const marker=bytes[i++];
   if(marker===0xd9||marker===0xda)break;
   if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
   if(i+2>bytes.length)return fail();
   const length=v.getUint16(i);if(length<2||i+length>bytes.length)return fail();
   if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
    if(length<8)return fail();return {width:v.getUint16(i+5),height:v.getUint16(i+3)};
   }i+=length;
  }return fail();
 }
 if(mime==="image/webp"){
  if(bytes.length<30)return fail();
  const chunk=String.fromCharCode(...bytes.subarray(12,16));
  if(chunk==="VP8X")return {width:1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),height:1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)};
  if(chunk==="VP8L"&&bytes[20]===0x2f){const bits=v.getUint32(21,true);return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};}
  if(chunk==="VP8 "&&bytes[23]===0x9d&&bytes[24]===1&&bytes[25]===0x2a)return {width:v.getUint16(26,true)&0x3fff,height:v.getUint16(28,true)&0x3fff};
 }
 return fail();
}
