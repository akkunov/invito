/**
 * Convert user assets to bounded, safe browser-local image data URLs.
 * SVG geometry is whitelisted and rasterized, never rendered as user-supplied markup.
 */
const MAX_SOURCE_BYTES=5_000_000;
const MAX_DATA_URL_LENGTH=700_000;
const SVG_NS="http://www.w3.org/2000/svg";
const TAGS=new Set(["svg","g","path","circle","ellipse","rect","line","polygon","polyline"]);
const ATTRS=new Set(["viewBox","width","height","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","d","points","fill","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-opacity","fill-opacity","opacity","transform"]);

function safeSvg(source:string):string {
  const parsed=new DOMParser().parseFromString(source,"image/svg+xml");
  const root=parsed.documentElement;
  if(root.localName!=="svg"||parsed.querySelector("parsererror"))throw Error("Файл SVG повреждён");
  let count=0;
  function clean(node:Element):Element{
    if(++count>300||!TAGS.has(node.localName))throw Error("SVG содержит неподдерживаемые элементы");
    const result=document.createElementNS(SVG_NS,node.localName);
    for(const attr of Array.from(node.attributes)){
      if(attr.name==="xmlns"&&attr.value===SVG_NS)continue;
      if(attr.namespaceURI||!ATTRS.has(attr.name)||attr.value.length>2000||
         /url\s*\(|javascript:|data:|@import|[<>]/i.test(attr.value))throw Error("SVG содержит недопустимые атрибуты");
      result.setAttribute(attr.name,attr.value);
    }
    for(const child of Array.from(node.childNodes)){
      if(child.nodeType===1)result.appendChild(clean(child as Element));
      else if(child.nodeType===3 && child.textContent?.trim())throw Error("Текст SVG пока не поддерживается");
    }
    return result;
  }
  const rebuilt=clean(root);
  rebuilt.setAttribute("xmlns",SVG_NS);
  if(!rebuilt.getAttribute("viewBox")){
    const width=Number.parseFloat(root.getAttribute("width")||"512");
    const height=Number.parseFloat(root.getAttribute("height")||"512");
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>10000||height>10000)throw Error("Неверные размеры SVG");
    rebuilt.setAttribute("viewBox",`0 0 ${width} ${height}`);
  }
  rebuilt.setAttribute("width","1024");
  rebuilt.setAttribute("height","1024");
  return new XMLSerializer().serializeToString(rebuilt);
}
function loadImage(src:string):Promise<HTMLImageElement>{
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(Error("Не удалось прочитать изображение"));
    img.src=src;
  });
}
export async function processStudioAsset(file:File):Promise<string>{
  if(file.size===0||file.size>MAX_SOURCE_BYTES)throw Error("Допустимый размер файла — до 5 МБ");
  const svg=/\.svg$/i.test(file.name)||file.type==="image/svg+xml";
  const supported=["image/png","image/jpeg","image/webp"].includes(file.type);
  if(!svg&&!supported)throw Error("Поддерживаются PNG, JPG, WebP и простые SVG-фигуры");
  let url:string;
  if(svg){
    const source=await file.text();
    if(source.length>250_000)throw Error("SVG не должен превышать 250 КБ");
    url=URL.createObjectURL(new Blob([safeSvg(source)],{type:"image/svg+xml"}));
  }else{
    url=URL.createObjectURL(file);
  }
  try{
    const img=await loadImage(url);
    const size=Math.max(img.naturalWidth,img.naturalHeight);
    if(size===0)throw Error("Изображение пустое");
    const scale=Math.min(1,1200/size);
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const context=canvas.getContext("2d");
    if(!context)throw Error("Canvas недоступен");
    context.drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [.86,.72,.58,.45]){
      const output=canvas.toDataURL("image/webp",quality);
      if(output.startsWith("data:image/webp;")&&output.length<MAX_DATA_URL_LENGTH)return output;
    }
    throw Error("Изображение слишком сложное. Уменьшите его размер.");
  }finally{URL.revokeObjectURL(url)}
}
