import type {ProjectDocumentV2,ProjectNodeV2} from "./document.schema.ts";

function canGrow(node:ProjectNodeV2):boolean {
 if(node.type==="text")return node.autoHeight===true;
 return node.type==="widget"&&["rsvp","schedule","location"].includes(node.block.kind);
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
      ?Math.max(44,Math.min(size*ratio,Math.floor(next.width/advance)))
      :size*Math.max(.88,ratio);
     return {...run,style:{...run.style,fontSize}};
    });
   }
   nodes[node.id]=next;
  }
  if(document.presentation==="alpine"&&growth>0){
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
