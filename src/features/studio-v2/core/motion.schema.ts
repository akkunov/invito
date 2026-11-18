import {z} from "zod";
export const motionPresets=["fade","slide-up","slide-left","scale","reveal","parallax"] as const;
export const motionTriggers=["load","viewport","hover","click","scroll"] as const;
export const motionEasings=["linear","ease","ease-in","ease-out","ease-in-out","smooth"] as const;
export const motionSchema=z.strictObject({
 preset:z.enum(motionPresets),
 trigger:z.enum(motionTriggers),
 duration:z.number().int().min(100).max(10000),
 delay:z.number().int().min(0).max(20000),
 easing:z.enum(motionEasings),
 distance:z.number().finite().min(0).max(400),
 fromScale:z.number().finite().min(.1).max(1),
}).superRefine((m,ctx)=>{if((m.preset==="parallax")!==(m.trigger==="scroll"))ctx.addIssue({code:"custom",path:["trigger"],message:"Parallax requires scroll; scroll requires parallax"});});
export type MotionSpec=z.infer<typeof motionSchema>;
export const defaultMotion:MotionSpec={preset:"slide-up",trigger:"viewport",duration:700,delay:0,easing:"smooth",distance:48,fromScale:.85};
