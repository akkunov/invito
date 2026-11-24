import {z} from "zod";
const color=z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const radius=z.number().finite().min(0).max(10000);
const percentage=z.number().finite().min(0).max(100);
const offset=z.number().finite().min(-2000).max(2000);
export const cornersSchema=z.strictObject({topLeft:radius,topRight:radius,bottomRight:radius,bottomLeft:radius});
export const visualSchema=z.strictObject({
 corners:cornersSchema.optional(),
 fill:z.discriminatedUnion("kind",[
  z.strictObject({kind:z.literal("solid"),color}),
  z.strictObject({kind:z.literal("linear"),angle:z.number().finite().min(0).max(360),stops:z.array(z.strictObject({color,position:z.number().finite().min(0).max(100)})).min(2).max(8).refine(s=>s.every((v,i)=>i===0||v.position>=s[i-1].position),"Stops must be ordered")}),
  z.strictObject({kind:z.literal("none")})
 ]).optional(),
 stroke:z.strictObject({color,width:z.number().finite().min(0).max(100),style:z.enum(["solid","dashed","dotted"])}).nullable().optional(),
 shadow:z.strictObject({color,x:offset,y:offset,blur:z.number().finite().min(0).max(300),spread:offset,opacity:z.number().finite().min(0).max(1)}).nullable().optional(),
 blur:z.number().finite().min(0).max(100).optional(),
 clipPolygon:z.array(z.tuple([percentage,percentage])).min(3).max(64).optional(),
 mask:z.enum(["rectangle","ellipse","diamond","arch"]).optional(),
 flipX:z.boolean().optional(),flipY:z.boolean().optional(),
 imageCrop:z.strictObject({zoom:z.number().finite().min(1).max(5),x:z.number().finite().min(0).max(1),y:z.number().finite().min(0).max(1)}).optional()
});
export type VisualProperties=z.infer<typeof visualSchema>;
export type Corners=z.infer<typeof cornersSchema>;
