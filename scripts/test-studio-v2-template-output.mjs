import assert from "node:assert/strict";
import {deflateSync,inflateSync} from "node:zlib";
import {printSize,rasterPdf,pngWithDpi,printStrips,pngHeader,pngIdat,pngEnd,pngStripRows,stripedPdfParts} from "../src/features/studio-v2/core/print-output.ts";
import {createEmptyProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {createTemplate,createThemeVariant,templateDocument} from "../src/features/studio-v2/core/template-registry.ts";
import {templatePreflight,printImageWarnings} from "../src/features/studio-v2/core/template-preflight.ts";
const size=printSize(1080,1920,105,300);
assert.equal(size.pixelWidth,1240);assert.equal(size.pixelHeight,2205);
assert.ok(Math.abs(size.heightMm-186.6666667)<.0001);
assert.throws(()=>printSize(1,100,600,600));
assert.throws(()=>printSize(1080,1920,600,600));
assert.throws(()=>printSize(1080,1920,0,300));
const sample={widthMm:25.4,heightMm:50.8,pixelWidth:1,pixelHeight:2,dpi:300};
const rgb=Buffer.from([255,0,0,0,255,0]);
const pdf=Buffer.from(rasterPdf(deflateSync(rgb),sample)),str=pdf.toString("latin1");
assert.ok(str.startsWith("%PDF-1.4"));assert.match(str,/\/MediaBox \[0 0 72\.00000 144\.00000\]/);
const xref=Number(str.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.subarray(xref,xref+4).toString(),"xref");
for(const [index,line] of str.slice(xref).split("\n").slice(3,8).entries()){const offset=Number(line.slice(0,10));assert.ok(str.slice(offset).startsWith((index+1)+" 0 obj"));}
const imageStart=str.indexOf("stream\n",str.indexOf("4 0 obj"))+7,imageEnd=str.indexOf("\nendstream",imageStart);
assert.deepEqual(inflateSync(pdf.subarray(imageStart,imageEnd)),rgb);
const original=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=","base64");
const png=Buffer.from(pngWithDpi(original,300)),index=png.indexOf("pHYs");assert.ok(index>0);assert.equal(png.readUInt32BE(index+4),11811);assert.equal(png.readUInt32BE(index+8),11811);assert.equal(png[index+12],1);
const twice=Buffer.from(pngWithDpi(png,600));assert.equal(twice.indexOf("pHYs"),twice.lastIndexOf("pHYs"));assert.equal(twice.readUInt32BE(twice.indexOf("pHYs")+4),23622);
const doc=createEmptyProjectV2("source");
assert.ok(templatePreflight(doc,"page-1").some(i=>i.code==="empty-page"&&i.severity==="error"));
doc.assets.bad={id:"bad",mimeType:"image/png",name:"Missing",sizeBytes:0,storageKey:"local:bad"};
assert.ok(templatePreflight(doc,"page-1",new Set()).some(i=>i.code==="resource"&&i.severity==="error"));
assert.deepEqual(printImageWarnings(doc,"page-1",105,300),[]);
const now="2026-11-18T06:30:00.000Z";
const record=createTemplate("template-a",{name:"Editorial",category:"wedding",description:"",tags:[],coverPageId:"page-1",status:"draft"},doc,now);
const variant=createThemeVariant(record,null,"template-b",now);
assert.equal(templateDocument(variant).id,"template-b");assert.equal(templateDocument(record).id,"template-a");assert.equal(variant.meta.status,"draft");
assert.throws(()=>createThemeVariant(record,"missing","template-c",now));
console.log("PASS: physical print sizes, PDF xref and RGB stream, PNG DPI, preflight, immutable variants");

const high=printSize(1080,1920,105,1200),ultra=printSize(1080,1920,105,2400);
assert.deepEqual([high.pixelWidth,high.pixelHeight],[4961,8819]);
assert.deepEqual([ultra.pixelWidth,ultra.pixelHeight],[9921,17638]);
for(const size of [high,ultra]){
 const bands=printStrips(size);let y=0;
 for(const b of bands){assert.equal(b.y,y);assert.ok(b.height*size.pixelWidth<=2_000_000);y+=b.height;}
 assert.equal(y,size.pixelHeight);
}
assert.throws(()=>printSize(1080,1920,148,2400));
const rgba=new Uint8ClampedArray([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]),mini={pixelWidth:2,pixelHeight:2,widthMm:25.4,heightMm:25.4,dpi:2400};
const rows=pngStripRows(rgba,2,2);
assert.deepEqual([...rows],[1,255,0,0,1,255,0,1,0,0,255,255,255,0]);
const encoded=Buffer.from(deflateSync(rows)),split=encoded.length>>1;
const multi=Buffer.concat([pngHeader(mini),pngIdat(encoded.subarray(0,split)),pngIdat(encoded.subarray(split)),pngEnd()]);
assert.equal(multi.readUInt32BE(16),2);
assert.equal(multi.readUInt32BE(multi.indexOf("pHYs")+4),94488);
const data=[];for(let at=8;at<multi.length;){const len=multi.readUInt32BE(at),type=multi.toString("ascii",at+4,at+8);if(type==="IDAT")data.push(multi.subarray(at+8,at+8+len));at+=len+12;}
assert.deepEqual(inflateSync(Buffer.concat(data)),Buffer.from(rows));
const striped=Buffer.concat(stripedPdfParts([{y:0,height:1,data:deflateSync(Buffer.from([255,0,0,0,255,0]))},{y:1,height:1,data:deflateSync(Buffer.from([0,0,255,255,255,255]))}],mini));
const stripedText=striped.toString("latin1");
assert.match(stripedText,/72\.00000000 0 0 36\.00000000 0 36\.00000000 cm/);
assert.match(stripedText,/72\.00000000 0 0 36\.00000000 0 0\.00000000 cm/);
assert.throws(()=>stripedPdfParts([{y:1,height:1,data:encoded}],mini));
console.log("PASS: 1200/2400dpi sizing, strip coverage, streaming PNG and positioned PDF bands");
