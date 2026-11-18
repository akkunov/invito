/** Last write wins within a paint frame. Flush before committing a drag transaction;
 * cancel before rolling it back. No browser dependency in the tested core. */
export function createFrameCoalescer<T>(apply:(value:T)=>void,schedule:(run:()=>void)=>number,cancel:(id:number)=>void){
 let frame:number|null=null,latest:{value:T}|null=null;
 function flush(){if(frame!==null){cancel(frame);frame=null;}const item=latest;latest=null;if(item)apply(item.value);}
 function clear(){if(frame!==null){cancel(frame);frame=null;}latest=null;}
 return {queue(value:T){latest={value};if(frame===null)frame=schedule(()=>{frame=null;flush();});},flush,clear};
}
