/** Physical print dimensions, bounded to safe browser canvas memory. */
export const PRINT_DPI=[150,300,600] as const;
export const PRINT_PRESETS=[{id:"a6",name:"A6 · 105 мм",width:105},{id:"a5",name:"A5 · 148 мм",width:148},{id:"card",name:"Карточка · 100 мм",width:100},{id:"custom",name:"Свой размер",width:150}] as const;
export type PrintDpi=typeof PRINT_DPI[number];
export function printSize(width:number,height:number,widthMm:number,dpi:PrintDpi){
 if(![width,height,widthMm,dpi].every(Number.isFinite)||width<=0||height<=0||widthMm<20||widthMm>600||!PRINT_DPI.includes(dpi))throw Error("Invalid print dimensions");
 const heightMm=widthMm*height/width,pixelWidth=Math.round(widthMm*dpi/25.4),pixelHeight=Math.round(heightMm*dpi/25.4);
 if(heightMm>1000||pixelWidth<1||pixelHeight<1||pixelWidth>10000||pixelHeight>10000||pixelWidth*pixelHeight>32_000_000)throw Error("Размер слишком большой для браузера. Уменьшите ширину или DPI.");
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
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
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
