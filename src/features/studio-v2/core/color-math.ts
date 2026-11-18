const clamp=(v:number,max=1)=>Math.max(0,Math.min(max,v));
export function normalizeHex(value:string){const s=value.trim().replace(/^#/,"");return /^[\da-f]{6}$/i.test(s)?"#"+s.toUpperCase():/^[\da-f]{3}$/i.test(s)?"#"+s.split("").map(c=>c+c).join("").toUpperCase():null;}
export function hexToHsv(hex:string){
 const color=normalizeHex(hex)??"#000000",r=parseInt(color.slice(1,3),16)/255,g=parseInt(color.slice(3,5),16)/255,b=parseInt(color.slice(5,7),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 let h=0;if(d)h=max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4;
 return {h:h*60,s:max?d/max:0,v:max};
}
export function hsvToHex(h:number,s:number,v:number){const hue=((h%360)+360)%360,c=clamp(v)*clamp(s),x=c*(1-Math.abs(hue/60%2-1)),m=clamp(v)-c;const rgb=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];return "#"+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,"0")).join("").toUpperCase();}
