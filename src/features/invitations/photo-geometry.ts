export type PhotoBounds={minWidth:number;minHeight:number;maxEdge?:number};

/** Preserve aspect ratio. A small photo is enlarged only enough for the
 * template's minimum; impossible aspect ratios are rejected, not distorted. */
export function photoDimensions(width:number,height:number,bounds:PhotoBounds){
 const maxEdge=bounds.maxEdge??2400;
 if(![width,height,bounds.minWidth,bounds.minHeight,maxEdge].every(n=>Number.isFinite(n)&&n>0))throw Error("INVALID_IMAGE_DIMENSIONS");
 const maximum=Math.max(maxEdge,bounds.minWidth,bounds.minHeight);
 const minScale=Math.max(bounds.minWidth/width,bounds.minHeight/height);
 const maxScale=maximum/Math.max(width,height);
 if(minScale>maxScale)throw Error("IMAGE_ASPECT_TOO_EXTREME");
 const scale=Math.min(maxScale,Math.max(1,minScale));
 return {width:Math.min(maximum,Math.max(bounds.minWidth,Math.round(width*scale))),height:Math.min(maximum,Math.max(bounds.minHeight,Math.round(height*scale)))};
}

/** Preserve original slots when a batch only partially uploads.
 * Fully successful replacement intentionally replaces the gallery. */
export function galleryAfterUpload(current:readonly string[],uploaded:readonly (string|null)[],limit:number,mode:"replace"|"append"){
 if(mode==="append")return [...current,...uploaded.filter((id):id is string=>id!==null)].slice(0,limit);
 if(uploaded.every(id=>id!==null))return uploaded.slice(0,limit) as string[];
 return Array.from({length:Math.min(limit,Math.max(current.length,uploaded.length))},(_,i)=>uploaded[i]??current[i]).filter((id):id is string=>Boolean(id));
}
