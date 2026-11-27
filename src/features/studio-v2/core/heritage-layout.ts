import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";

export function isHeritagePresentation(presentation: ProjectDocumentV2["presentation"]): boolean {
 return presentation==="heritage"||presentation==="gilded"||presentation==="alpine"||presentation==="felt";
}

function canGrow(node:ProjectNodeV2):boolean {
 if(node.type==="text")return node.autoHeight===true;
 return node.type==="widget"&&(["rsvp","schedule","location"].includes(node.block.kind)||node.block.kind==="music"&&node.appearance.preset==="stationery");
}

function lineAdvance(text:string):number {
 return Array.from(text).reduce((advance,letter)=>{
  if(/[ЖШЩМЮ]/i.test(letter))return advance+.97;
  return advance+(/\s/.test(letter)?.26:.70);
 },0);
}

/** Keep controls at their authored CSS size on narrow viewports. Measured
 * overflow moves subsequent layers, including the paper's bottom ornament. */
export function layoutHeritagePresentation(document:ProjectDocumentV2,width:number,measurements:Record<string,number>):ProjectDocumentV2 {
 const nodes={...document.nodes};
 const ratio=Math.min(1,width/390);
 const felt=document.presentation==="felt";
 for(const page of document.pages){
  const root=document.nodes[page.rootNodeId];
  if(root.type!=="frame")continue;
  const children=root.children.map(id=>document.nodes[id]);
  const expansions=children.filter(canGrow).map(node=>({
   id:node.id,y:node.y,extra:Math.max(0,(measurements[node.id]??0)-node.height),
  }));
  let growth=0;
  for(const node of children){
   const shift=expansions.filter(source=>source.y<node.y).reduce((sum,source)=>sum+source.extra,0);
   const extra=expansions.find(source=>source.id===node.id)?.extra??0;
   growth=Math.max(growth,shift+extra);
   const next={...node,x:node.x*ratio,width:node.width*ratio,y:node.y+shift,height:node.height+extra};
   if(document.presentation==="alpine"&&ratio<1&&node.type==="widget"&&node.block.kind==="rsvp"){
    const marginAdjustment=Math.round((1-ratio)*40);
    next.x-=marginAdjustment;
    next.width+=marginAdjustment*2;
   }
   if(next.type==="text"){
    const names=next.bindingKey==="coupleNames";
    const advance=names?Math.max(1,...next.runs.flatMap(run=>run.text.split("\n").map(lineAdvance))):1;
    next.runs=next.runs.map(run=>{
     const size=run.style.fontSize;
     const fontSize=names
      ?Math.max(felt?40:44,Math.min(size*ratio,Math.floor(next.width/advance)))
      :size*Math.max(.88,ratio);
     return {...run,style:{...run.style,fontSize}};
    });
   }
   nodes[node.id]=next;
  }
  if((document.presentation==="alpine"||felt)&&growth>0){
   for(const node of children){
    if(node.type==="image"&&node.x===0&&node.y===0&&node.width===root.width&&node.height===root.height){
     nodes[node.id]={...nodes[node.id],height:node.height+growth};
    }
   }
  }
  nodes[root.id]={...root,width:root.width*ratio,height:root.height+growth};
 }
 return {...document,nodes};
}


/** Resize authored columns in CSS pixels. Measured blocks and text reserve
 * their own height before moving later rows. Adjacent columns stay aligned. */
export function layoutCollection(document: ProjectDocumentV2, width: number, measurements: Record<string, number>): ProjectDocumentV2 {
 const nodes = {...document.nodes};
 for (const page of document.pages) {
  const root = document.nodes[page.rootNodeId];
  if (root.type !== "frame") continue;
  const targetWidth = Math.min(width, 500);
  const ratio = targetWidth / root.width;
  const children = root.children.map(id => document.nodes[id]);
  const growth = children.filter(canGrow).map(node => ({
   bottom: node.y + node.height,
   extra: Math.max(0, (measurements[node.id] ?? 0) - node.height),
  })).filter(row => row.extra > 0);
  let height = root.height;
  for (const node of children) {
   const shift = growth.filter(row => row.bottom <= node.y + 1).reduce((sum, row) => sum + row.extra, 0);
   const next = {...node, x: node.x * ratio, width: node.width * ratio, y: node.y + shift};
   if (canGrow(node)) next.height = Math.max(node.height, measurements[node.id] ?? 0);
   if (next.type === "text") {
    const minFontSize = next.fitMinFontSize;
    const scaleWidth = next.widthScale ?? 1;
    const fittingSize = minFontSize === undefined ? undefined
     : next.width / (Math.max(1,...next.runs.map(run=>run.text).join("").split("\n").map(lineAdvance))*scaleWidth);
    next.runs = next.runs.map(run => {
     const scaledSize = run.style.fontSize * Math.min(1.1, Math.max(.78, ratio));
     const fontSize = minFontSize === undefined || fittingSize === undefined
      ? scaledSize : Math.min(scaledSize, Math.max(minFontSize, fittingSize));
     return {...run,style:{...run.style,fontSize}};
    });
   }
   height = Math.max(height, next.y + next.height, root.height + shift);
   nodes[node.id] = next;
  }
  nodes[root.id] = {...root, width: targetWidth, height};
 }
 return {...document, nodes};
}
