import {z} from "zod";
import {visualSchema} from "./appearance.schema.ts";
const id=z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const color=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const base={id,name:z.string().trim().min(1).max(100)};
export const tokenSlots=["fill","textColor","typography","stroke","effect","corners"] as const;
export const tokenRefsSchema=z.strictObject(Object.fromEntries(tokenSlots.map(slot=>[slot,id.optional()])) as Record<typeof tokenSlots[number],ReturnType<typeof id.optional>>);
export const typographySchema=z.strictObject({
 fontFamily:z.enum(["sans","serif"]),fontSize:z.number().finite().min(6).max(400),fontWeight:z.number().int().min(100).max(900),
 lineHeight:z.number().finite().min(.8).max(4),letterSpacing:z.number().finite().min(-10).max(60)
});
export const tokenSchema=z.discriminatedUnion("kind",[
 z.strictObject({...base,kind:z.literal("color"),value:color}),
 z.strictObject({...base,kind:z.literal("fill"),value:visualSchema.shape.fill.unwrap()}),
 z.strictObject({...base,kind:z.literal("typography"),value:typographySchema}),
 z.strictObject({...base,kind:z.literal("stroke"),value:visualSchema.shape.stroke.unwrap()}),
 z.strictObject({...base,kind:z.literal("effect"),value:z.strictObject({shadow:visualSchema.shape.shadow.unwrap(),blur:z.number().finite().min(0).max(100)})}),
 z.strictObject({...base,kind:z.literal("corners"),value:visualSchema.shape.corners.unwrap()}),
]);
export type StyleToken=z.infer<typeof tokenSchema>;
export type TokenSlot=typeof tokenSlots[number];
export type TokenRefs=z.infer<typeof tokenRefsSchema>;
export const slotKinds:Record<TokenSlot,readonly StyleToken["kind"][]>={fill:["color","fill"],textColor:["color"],typography:["typography"],stroke:["stroke"],effect:["effect"],corners:["corners"]};
export function compatibleToken(slot:TokenSlot,token:StyleToken){return slotKinds[slot].includes(token.kind);}
