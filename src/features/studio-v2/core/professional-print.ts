/** Geometry for professional printing. Width is the artwork/media width, not trim width. */
export function professionalGeometry(width:number,height:number,widthMm:number,bleedMm:number){
 if(![width,height,widthMm,bleedMm].every(Number.isFinite)||width<=0||height<=0||widthMm<20||widthMm>600||bleedMm<0||bleedMm>10)throw Error("Недопустимый размер печати или вылетов");
 const heightMm=widthMm*height/width,trimWidthMm=widthMm-2*bleedMm,trimHeightMm=heightMm-2*bleedMm;
 if(heightMm>1000||trimWidthMm<10||trimHeightMm<10)throw Error("Недопустимая область обрезки");
 return {widthMm,heightMm,trimWidthMm,trimHeightMm,bleedMm};
}
export type ProfessionalGeometry=ReturnType<typeof professionalGeometry>;
export type PrintSource={format:"invito-print";version:1;geometry:ProfessionalGeometry;html:string};
const escapeHtml=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
/** Static artwork, printable at physical size. No script, network requests or interactive controls. */
export function professionalPrintSource(art:{markup:string;width:number;height:number},widthMm:number,bleedMm:number,title:string):PrintSource{
 const geometry=professionalGeometry(art.width,art.height,widthMm,bleedMm);
 const {widthMm:w,heightMm:h}=geometry,scale=w*96/25.4/art.width;
 const html='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; form-action \'none\'; base-uri \'none\'"><title>'+escapeHtml(title)+'</title><style>@page{size:'+w+'mm '+h+'mm;margin:0}html,body{margin:0!important;padding:0!important;width:'+w+'mm;height:'+h+'mm;overflow:hidden;background:white;color-scheme:light;-webkit-print-color-adjust:exact;print-color-adjust:exact}*{animation:none!important;transition:none!important}#artwork{position:relative;overflow:hidden;width:'+w+'mm;height:'+h+'mm;break-inside:avoid}#design{position:absolute;top:0;left:0;width:'+art.width+'px;height:'+art.height+'px;transform-origin:0 0;transform:scale('+scale+');} </style></head><body><div id="artwork"><div id="design">'+art.markup+'</div></div></body></html>';
 return {format:"invito-print",version:1,geometry,html};
}
