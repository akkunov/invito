import {z} from "zod";
export const bindingKeySchema=z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,99}$/);
const assetId=z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
export const instantSchema=z.iso.datetime({offset:true}).refine(value=>Number.isFinite(Date.parse(value)),"Invalid date");
const localized=z.strictObject({ru:z.string().max(500),ky:z.string().max(500)});
export const bindingValueSchema=z.discriminatedUnion("type",[
 z.strictObject({type:z.literal("text"),value:localized}),
 z.strictObject({type:z.literal("date"),value:instantSchema}),
 z.strictObject({type:z.literal("number"),value:z.number().finite()}),
 z.strictObject({type:z.literal("boolean"),value:z.boolean()}),
]);
export const musicSourceSchema=z.string().max(1000).refine(value=>{
 if(value==="")return true;
 if(/^asset:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value))return true;
 if(/^\/audio\/[a-zA-Z0-9_/-]+\.(mp3|ogg|m4a|wav)$/i.test(value))return true;
 try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash&&/\.(mp3|ogg|m4a|wav)$/i.test(url.pathname);}catch{return false;}
},"Use a verified asset:UUID, HTTPS audio file or /audio/ path");
export const invitationBlockSchema=z.discriminatedUnion("kind",[
 z.strictObject({kind:z.literal("rsvp"),title:localized,deadline:instantSchema.nullable(),maxGuests:z.number().int().min(1).max(10)}),
 z.strictObject({kind:z.literal("countdown"),title:localized,target:instantSchema,targetKey:bindingKeySchema.nullable()}),
 z.strictObject({kind:z.literal("location"),title:localized,address:localized,addressKey:bindingKeySchema.nullable()}),
 z.strictObject({kind:z.literal("gallery"),title:localized,assetIds:z.array(assetId).max(4).refine(ids=>new Set(ids).size===ids.length,"Duplicate photo")}),
 z.strictObject({kind:z.literal("music"),title:localized,source:musicSourceSchema}),
 z.strictObject({kind:z.literal("schedule"),title:localized,items:z.array(z.strictObject({time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),label:localized})).max(20)}),
]);
export const blockAppearanceSchema=z.strictObject({fontFamily:z.enum(["sans","serif"]),fontSize:z.number().min(12).max(100),color:z.string().regex(/^#[0-9A-Fa-f]{6}$/),background:z.union([z.literal("transparent"),z.string().regex(/^#[0-9A-Fa-f]{6}$/)]),accent:z.string().regex(/^#[0-9A-Fa-f]{6}$/)});
export const rsvpInputSchema=z.strictObject({name:z.string().trim().min(1).max(120),attendance:z.enum(["yes","no"]),guests:z.number().int().min(0).max(10)}).superRefine((v,ctx)=>{if(v.attendance==="no"?v.guests!==0:v.guests<1)ctx.addIssue({code:"custom",path:["guests"],message:"Invalid guest count"});});
export type InvitationBlock=z.infer<typeof invitationBlockSchema>;
export type BindingValue=z.infer<typeof bindingValueSchema>;
export type RsvpInput=z.infer<typeof rsvpInputSchema>;
