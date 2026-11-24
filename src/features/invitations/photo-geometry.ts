export type PhotoBounds={minWidth:number;minHeight:number;maxEdge?:number};

/** Keep original proportions wherever possible. Crop only extreme panoramas
 * that cannot satisfy both template minimum and the server's maximum. */
export function photoDimensions(width:number,height:number,bounds:PhotoBounds){
 const maxEdge=bounds.maxEdge??2400;
 if(![width,height,bounds.minWidth,bounds.minHeight,maxEdge].every(n=>Number.isFinite(n)&&n>0))throw Error("INVALID_IMAGE_DIMENSIONS");
 const maximum=Math.min(4096,Math.max(maxEdge,bounds.minWidth,bounds.minHeight));
 if(bounds.minWidth>maximum||bounds.minHeight>maximum)throw Error("INVALID_IMAGE_DIMENSIONS");
 const sourceWidth=Math.min(width,height*maximum/bounds.minHeight);
 const sourceHeight=Math.min(height,width*maximum/bounds.minWidth);
 const sourceX=(width-sourceWidth)/2,sourceY=(height-sourceHeight)/2;
 const minScale=Math.max(bounds.minWidth/sourceWidth,bounds.minHeight/sourceHeight);
 const maxScale=maximum/Math.max(sourceWidth,sourceHeight);
 const scale=Math.min(maxScale,Math.max(1,minScale));
 return {width:Math.min(maximum,Math.max(bounds.minWidth,Math.round(sourceWidth*scale))),
   height:Math.min(maximum,Math.max(bounds.minHeight,Math.round(sourceHeight*scale))),
   sourceX,sourceY,sourceWidth,sourceHeight};
}

/** Preserve original slots when a batch only partially uploads.
 * Fully successful replacement intentionally replaces the gallery. */
export function galleryAfterUpload(current:readonly string[],uploaded:readonly (string|null)[],limit:number,mode:"replace"|"append"){
 if(mode==="append")return [...current,...uploaded.filter((id):id is string=>id!==null)].slice(0,limit);
 if(uploaded.every(id=>id!==null))return uploaded.slice(0,limit) as string[];
 return Array.from({length:Math.min(limit,Math.max(current.length,uploaded.length))},(_,i)=>uploaded[i]??current[i]).filter((id):id is string=>Boolean(id));
}
