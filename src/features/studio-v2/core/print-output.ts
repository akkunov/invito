/** Physical print dimensions, bounded to safe browser canvas memory. */
export const PRINT_DPI=[150,300,600,1200,2400] as const;
export const PRINT_PRESETS=[{id:"a6",name:"A6 · 105 мм",width:105},{id:"a5",name:"A5 · 148 мм",width:148},{id:"card",name:"Карточка · 100 мм",width:100},{id:"custom",name:"Свой размер",width:150}] as const;
export type PrintDpi=typeof PRINT_DPI[number];
export function printSize(width:number,height:number,widthMm:number,dpi:PrintDpi){
 if(![width,height,widthMm,dpi].every(Number.isFinite)||width<=0||height<=0||widthMm<20||widthMm>600||!PRINT_DPI.includes(dpi))throw Error("Invalid print dimensions");
 const heightMm=widthMm*height/width,pixelWidth=Math.round(widthMm*dpi/25.4),pixelHeight=Math.round(heightMm*dpi/25.4);
 if(heightMm>1000||pixelWidth<1||pixelHeight<1||pixelWidth>16384||pixelHeight>32768||pixelWidth*pixelHeight>200_000_000)throw Error("Размер слишком большой для браузера. Уменьшите ширину или DPI.");
 return {widthMm,heightMm,pixelWidth,pixelHeight,dpi};
}
export type PrintSize=ReturnType<typeof printSize>;
const ascii=(s:string)=>new TextEncoder().encode(s);
function concat(parts:readonly Uint8Array[]){const result=new Uint8Array(parts.reduce((sum,p)=>sum+p.length,0));let offset=0;for(const p of parts){result.set(p,offset);offset+=p.length;}return result;}
/** Single-page RGB PDF, lossless Flate image stream. Page dimensions are physical points. */
export function rasterPdf(rgbDeflated:Uint8Array,size:PrintSize):Uint8Array{
 const w=(size.widthMm*72/25.4).toFixed(5),h=(size.heightMm*72/25.4).toFixed(5);
 const commands=ascii("q\n"+w+" 0 0 "+h+" 0 0 cm\n/Im0 Do\nQ\n");
 const stream=(dict:string,data:Uint8Array)=>concat([ascii("<< "+dict+" /Length "+data.length+" >>\nstream\n"),data,ascii("\nendstream")]);
 const objects=[ascii("<< /Type /Catalog /Pages 2 0 R >>"),ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+w+" "+h+"] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"),stream("/Type /XObject /Subtype /Image /Width "+size.pixelWidth+" /Height "+size.pixelHeight+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode",rgbDeflated),stream("",commands)];
 const parts=[ascii("%PDF-1.4\n")],offsets=[0];let offset=parts[0].length;
 objects.forEach((obj,i)=>{const part=concat([ascii((i+1)+" 0 obj\n"),obj,ascii("\nendobj\n")]);offsets.push(offset);parts.push(part);offset+=part.length;});
 const xref=offset;
 parts.push(ascii("xref\n0 "+offsets.length+"\n0000000000 65535 f \n"+offsets.slice(1).map(n=>String(n).padStart(10,"0")+" 00000 n \n").join("")+"trailer\n<< /Size "+offsets.length+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n"));return concat(parts);
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);return c>>>0;});
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes)crc=(crc>>>8)^crcTable[(crc^byte)&255];return (crc^0xffffffff)>>>0;}
/** Replace existing pHYs (canvas exports usually default to 96dpi). */
export function pngWithDpi(png:Uint8Array,dpi:PrintDpi):Uint8Array{
 if(png.length<33||png[0]!==137||String.fromCharCode(...png.slice(1,4))!=="PNG")throw Error("Invalid PNG");
 const view=new DataView(png.buffer,png.byteOffset,png.byteLength),data=new Uint8Array(13),dv=new DataView(data.buffer);
 data.set(ascii("pHYs"));const ppm=Math.round(dpi/0.0254);dv.setUint32(4,ppm);dv.setUint32(8,ppm);data[12]=1;
 const chunk=new Uint8Array(21),cv=new DataView(chunk.buffer);cv.setUint32(0,9);chunk.set(data,4);cv.setUint32(17,crc32(data));
 const parts=[png.slice(0,8)];let i=8,inserted=false;
 while(i+12<=png.length){const len=view.getUint32(i),end=i+len+12;if(end>png.length)throw Error("Invalid PNG chunk");const type=String.fromCharCode(...png.slice(i+4,i+8));if(type!=="pHYs")parts.push(png.slice(i,end));if(type==="IHDR"){parts.push(chunk);inserted=true;}i=end;if(type==="IEND")break;}
 if(!inserted||i!==png.length)throw Error("Invalid PNG structure");return concat(parts);
}

export type PrintStrip={y:number;height:number};
/** The complete pixel grid is covered without gaps; only one strip is rasterized at a time. */
export function printStrips(size:Pick<PrintSize,"pixelWidth"|"pixelHeight">):PrintStrip[]{
 const {pixelWidth:w,pixelHeight:h}=size;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>16384||h>32768||w*h>200_000_000)throw Error("Invalid strip dimensions");
 const step=Math.max(1,Math.min(512,Math.floor(2_000_000/w)));
 return Array.from({length:Math.ceil(h/step)},(_,i)=>({y:i*step,height:Math.min(step,h-i*step)}));
}
function pngChunk(type:string,data:Uint8Array){const chunk=new Uint8Array(12+data.length),v=new DataView(chunk.buffer);v.setUint32(0,data.length);chunk.set(ascii(type),4);chunk.set(data,8);v.setUint32(8+data.length,crc32(chunk.subarray(4,8+data.length)));return chunk;}
export function pngHeader(size:PrintSize){
 const header=new Uint8Array(13),v=new DataView(header.buffer);v.setUint32(0,size.pixelWidth);v.setUint32(4,size.pixelHeight);header[8]=8;header[9]=2;
 const phys=new Uint8Array(9),pv=new DataView(phys.buffer);pv.setUint32(0,Math.round(size.dpi/.0254));pv.setUint32(4,Math.round(size.dpi/.0254));phys[8]=1;
 return concat([new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk("IHDR",header),pngChunk("pHYs",phys)]);
}
export function pngIdat(data:Uint8Array){return pngChunk("IDAT",data);}
export function pngEnd(){return pngChunk("IEND",new Uint8Array());}
/** Each row uses PNG Sub filtering, so large flat artwork compresses efficiently. */
export function pngStripRows(rgba:Uint8ClampedArray,width:number,height:number){
 if(rgba.length!==width*height*4)throw Error("Invalid strip pixels");
 const stride=width*3+1,out=new Uint8Array(stride*height);
 for(let y=0;y<height;y++){let j=y*stride;out[j++]=1;let r=0,g=0,b=0;for(let x=0;x<width;x++){const i=(y*width+x)*4;out[j++]=rgba[i]-r;out[j++]=rgba[i+1]-g;out[j++]=rgba[i+2]-b;r=rgba[i];g=rgba[i+1];b=rgba[i+2];}}
 return out;
}
export type CompressedPrintStrip=PrintStrip&{data:Uint8Array};
/** PDF embeds independently compressed bands; no full-page RGB allocation. */
export function stripedPdfParts(strips:readonly CompressedPrintStrip[],size:PrintSize):Uint8Array[]{
 let y=0;for(const s of strips){if(s.y!==y||!Number.isInteger(s.height)||s.height<1)throw Error("Invalid PDF strip order");y+=s.height;}if(y!==size.pixelHeight)throw Error("Incomplete PDF strips");
 const w=size.widthMm*72/25.4,h=size.heightMm*72/25.4,n=strips.length,contentId=4+n;
 const fmt=(v:number)=>v.toFixed(8);
 const resources=strips.map((_,i)=>"/Im"+i+" "+(4+i)+" 0 R").join(" ");
 const parts:Uint8Array[]=[ascii("%PDF-1.4\n")],offsets=[0];let offset=parts[0].length;
 function add(id:number,body:Uint8Array[]){offsets.push(offset);for(const p of [ascii(id+" 0 obj\n"),...body,ascii("\nendobj\n")]){parts.push(p);offset+=p.length;}}
 function stream(dict:string,data:Uint8Array){return [ascii("<< "+dict+" /Length "+data.length+" >>\nstream\n"),data,ascii("\nendstream")];}
 add(1,[ascii("<< /Type /Catalog /Pages 2 0 R >>")]);add(2,[ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")]);
 add(3,[ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+w.toFixed(5)+" "+h.toFixed(5)+"] /Resources << /XObject << "+resources+" >> >> /Contents "+contentId+" 0 R >>")]);
 strips.forEach((s,i)=>add(4+i,stream("/Type /XObject /Subtype /Image /Width "+size.pixelWidth+" /Height "+s.height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode",s.data)));
 const commands=ascii(strips.map((s,i)=>"q\n"+fmt(w)+" 0 0 "+fmt(h*s.height/size.pixelHeight)+" 0 "+fmt(h*(size.pixelHeight-s.y-s.height)/size.pixelHeight)+" cm\n/Im"+i+" Do\nQ\n").join(""));
 add(contentId,stream("",commands));const xref=offset;
 parts.push(ascii("xref\n0 "+offsets.length+"\n0000000000 65535 f \n"+offsets.slice(1).map(n=>String(n).padStart(10,"0")+" 00000 n \n").join("")+"trailer\n<< /Size "+offsets.length+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n"));return parts;
}
