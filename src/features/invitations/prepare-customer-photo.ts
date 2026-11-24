"use client";

import {photoDimensions,type PhotoBounds} from "./photo-geometry";

const MAX_INPUT_BYTES=60*1024*1024;
const MAX_OUTPUT_BYTES=20*1024*1024;

async function decode(blob:Blob):Promise<{image:CanvasImageSource;width:number;height:number;dispose:()=>void}>{
 if(typeof createImageBitmap==="function"){
  try{
   const bitmap=await createImageBitmap(blob,{imageOrientation:"from-image"});
   return {image:bitmap,width:bitmap.width,height:bitmap.height,dispose:()=>bitmap.close()};
  }catch{/* Safari and some formats need the HTML image decoder. */}
 }
 const url=URL.createObjectURL(blob);
 try{
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error("IMAGE_DECODE_FAILED"));image.src=url;});
  return {image,width:image.naturalWidth,height:image.naturalHeight,dispose:()=>URL.revokeObjectURL(url)};
 }catch(error){URL.revokeObjectURL(url);throw error;}
}
function encode(canvas:HTMLCanvasElement,type:string,quality:number){
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error("IMAGE_ENCODE_FAILED")),type,quality));
}

/** No cloud conversion: decode, orient, resize and strip photo metadata locally. */
export async function prepareCustomerPhoto(file:File,bounds:PhotoBounds):Promise<File>{
 if(!file.size||file.size>MAX_INPUT_BYTES)throw Error("IMAGE_INPUT_TOO_LARGE");
 let decoded;
 try{decoded=await decode(file);}
 catch{
  const {isHeic,heicTo}=await import("heic-to/csp");
  if(!await isHeic(file))throw Error("IMAGE_UNSUPPORTED");
  decoded=await decode(await heicTo({blob:file,type:"image/jpeg",quality:.95}));
 }
 const canvas=window.document.createElement("canvas");
 try{
  const {width,height}=photoDimensions(decoded.width,decoded.height,bounds);
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("IMAGE_CANVAS_UNAVAILABLE");
  ctx.imageSmoothingQuality="high";
  ctx.drawImage(decoded.image,0,0,width,height);
  let blob=await encode(canvas,"image/webp",.86);
  if(blob.type!=="image/webp"){
   // JPEG fallback for browsers without a WebP encoder.
   ctx.globalCompositeOperation="destination-over";ctx.fillStyle="#ffffff";ctx.fillRect(0,0,width,height);
   blob=await encode(canvas,"image/jpeg",.86);
  }
  if(blob.size>MAX_OUTPUT_BYTES)throw Error("IMAGE_OUTPUT_TOO_LARGE");
  const extension=blob.type==="image/webp"?"webp":blob.type==="image/jpeg"?"jpg":"png";
  const name=(file.name.replace(/\.[^.]+$/,"").slice(0,100)||"photo")+"."+extension;
  return new File([blob],name,{type:blob.type,lastModified:Date.now()});
 }finally{decoded.dispose();canvas.width=0;canvas.height=0;}
}
