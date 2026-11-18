#!/usr/bin/env node
import {readFile,writeFile,mkdtemp,rm,stat,copyFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {tmpdir} from "node:os";
import {createRequire} from "node:module";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {pathToFileURL} from "node:url";
const exec=promisify(execFile);
const run=(cmd,args)=>exec(cmd,args,{timeout:180000,maxBuffer:8*1024*1024,windowsHide:true});
export function validatePrintSource(source){
 const g=source?.geometry;
 if(source?.format!=="invito-print"||source.version!==1||typeof source.html!=="string"||source.html.length>100_000_000||!g)throw Error("Invalid print source");
 const {widthMm:w,heightMm:h,bleedMm:b,trimWidthMm:tw,trimHeightMm:th}=g;
 if(![w,h,b,tw,th].every(Number.isFinite)||w<20||w>600||h<10||h>1000||b<0||b>10||tw<10||th<10||Math.abs(tw-(w-2*b))>1e-6||Math.abs(th-(h-2*b))>1e-6)throw Error("Invalid print geometry");
 return source;
}
export function validateCmykProfile(bytes){
 if(bytes.length<128||bytes.length>32*1024*1024||bytes.toString("ascii",36,40)!=="acsp"||bytes.toString("ascii",16,20)!=="CMYK"||bytes.toString("ascii",12,16)!=="prtr"||bytes.readUInt32BE(0)!==bytes.length)throw Error("Expected a complete CMYK output (printer) ICC profile");
}
export async function chromiumPdf(source){
 validatePrintSource(source);
 const require=createRequire(process.env.STUDIO_BROWSER_PREFIX?join(process.env.STUDIO_BROWSER_PREFIX,"package.json"):import.meta.url);
 const {chromium}=require("playwright");
 // Isolated local conversion, scripts disabled, no external requests.
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({javaScriptEnabled:false,offline:true,serviceWorkers:"block"});
  await context.route("**/*",route=>route.abort());
  const page=await context.newPage();
  await page.setContent(source.html,{waitUntil:"load",timeout:60000});
  await page.emulateMedia({media:"print"});
  const dimensions=await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));const art=document.querySelector("#artwork");if(!art)throw Error("Missing artwork");return {width:art.getBoundingClientRect().width,height:art.getBoundingClientRect().height};});
  const g=source.geometry;
  if(Math.abs(dimensions.width-g.widthMm*96/25.4)>1||Math.abs(dimensions.height-g.heightMm*96/25.4)>1)throw Error("Print artwork geometry mismatch");
  return await page.pdf({width:g.widthMm+"mm",height:g.heightMm+"mm",preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false,margin:{top:0,right:0,bottom:0,left:0},tagged:false,outline:false});
 }finally{await browser.close();}
}
const psHex=s=>"<"+Buffer.from(s,"utf8").toString("hex")+">";
export function pdfxDefinition(profile,identifier,bleedMm){
 const offset=(bleedMm*72/25.4).toFixed(8);
 // ICC output intent and explicit inward trim. Ghostscript writes the remaining PDF/X metadata.
 return `%!
[ /GTS_PDFXVersion (PDF/X-4) /Trapped /False /DOCINFO pdfmark
[/_objdef {invitoICC} /type /stream /OBJ pdfmark
[{invitoICC} << /N 4 >> /PUT pdfmark
[{invitoICC} ${psHex(profile)} (r) file /PUT pdfmark
[/_objdef {invitoIntent} /type /dict /OBJ pdfmark
[{invitoIntent} << /Type /OutputIntent /S /GTS_PDFX /OutputConditionIdentifier ${psHex(identifier)} /Info ${psHex(identifier)} /DestOutputProfile {invitoICC} >> /PUT pdfmark
[{Catalog} << /OutputIntents [ {invitoIntent} ] >> /PUT pdfmark
<< /PDFXTrimBoxToMediaBoxOffset [${offset} ${offset} ${offset} ${offset}] /PDFXSetBleedBoxToMediaBox true >> setdistillerparams
`;
}
async function convert(source,mode,profile,identifier,output,validator){
 if(mode==="pdfx4"&&!validator)throw Error("PDF/X-4 requires INVITO_PDFX_VALIDATOR: path to independent preflight executable (PDF path argument, exit 0 only for PDF/X-4 pass)");
 const gs=process.env.INVITO_GS??(process.platform==="win32"?"gswin64c":"gs");
 const version=(await run(gs,["--version"])).stdout.trim(),[major,minor]=version.split(".").map(Number);
 if(!Number.isFinite(major)||major<10||major===10&&minor<6)throw Error("Ghostscript 10.06 or newer is required for this pipeline");
 const icc=await readFile(profile);validateCmykProfile(icc);
 const work=await mkdtemp(join(tmpdir(),"invito-prepress-"));
 try{
  const rgb=join(work,"source.pdf"),target=join(work,"converted.pdf"),iccPath=join(work,"output.icc"),definition=join(work,"intent.ps");
  await writeFile(rgb,await chromiumPdf(source));await writeFile(iccPath,icc);
  const args=["-dSAFER","-dBATCH","-dNOPAUSE","-sDEVICE=pdfwrite","-sColorConversionStrategy=CMYK","-sProcessColorModel=DeviceCMYK","-sOutputICCProfile="+iccPath,"-dEmbedAllFonts=true","-dSubsetFonts=true","-dDownsampleColorImages=false","-dDownsampleGrayImages=false","-dDownsampleMonoImages=false","-dAutoFilterColorImages=false","-dColorImageFilter=/FlateEncode","-dAutoFilterGrayImages=false","-dGrayImageFilter=/FlateEncode","--permit-file-read="+iccPath,"-sOutputFile="+target];
  if(mode==="pdfx4"){
   await writeFile(definition,pdfxDefinition(iccPath.replaceAll("\\","/"),identifier,source.geometry.bleedMm));
   args.push("-dPDFX=4","-dPDFACompatibilityPolicy=2","-dCompatibilityLevel=1.6",definition);
  }else args.push("-dCompatibilityLevel=1.6");
  await run(gs,[...args,rgb]);
  if((await stat(target)).size<100)throw Error("Ghostscript did not produce a PDF");
  if(mode==="pdfx4")await run(validator,[target]);
  // No file with a claimed PDF/X-4 status is delivered unless independent validation succeeds.
  await copyFile(target,output);
 }finally{await rm(work,{recursive:true,force:true});}
}
async function main(){
 const [sourcePath,outputPath,mode="vector",profile,identifier]=process.argv.slice(2);
 if(!sourcePath||!outputPath||!["vector","cmyk","pdfx4"].includes(mode))throw Error("Usage: node scripts/print-professional.mjs source.invito-print.json output.pdf vector|cmyk|pdfx4 [output.icc] [printing-condition]");
 if(resolve(sourcePath)===resolve(outputPath))throw Error("Output must differ from input");
 if((await stat(sourcePath)).size>115_000_000)throw Error("Print source too large");
 const source=validatePrintSource(JSON.parse(await readFile(sourcePath,"utf8")));
 if(mode==="vector")await writeFile(outputPath,await chromiumPdf(source));
 else{
  if(!profile||!identifier||identifier.length>200)throw Error("Provide the print shop's CMYK ICC profile and printing condition name");
  await convert(source,mode,resolve(profile),identifier,resolve(outputPath),process.env.INVITO_PDFX_VALIDATOR);
 }
 console.log("Export complete:",outputPath,mode);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
