import {z} from "zod";
import {rsvpWishSchema} from "../../../../src/features/studio-v2/core/invitation.schema.js";
import {parseInput, pagingInput, slug} from "../documents/documents-input.js";

const uuid=z.uuid();
export const createPublicationSchema=z.strictObject({
  slug,
  projectRevisionId:uuid,
  expectedRelease:z.number().int().min(0),
  idempotencyKey:z.string().min(16).max(120).regex(/^[A-Za-z0-9_-]+$/),
});
export const unpublishSchema=z.strictObject({expectedRelease:z.number().int().min(1)});
export const rsvpSchema=z.strictObject({
  requestId:uuid,
  nodeId:z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/),
  name:z.string().trim().min(1).max(120),
  attendance:z.enum(["yes","no"]),
  guests:z.number().int().min(0).max(10),
  wish:rsvpWishSchema,
  turnstileToken:z.string().max(2048).optional(),
  // Honeypot must remain empty. It is not a replacement for Turnstile.
  website:z.string().max(100).default(""),
}).superRefine((v,ctx)=>{
  if ((v.attendance==="no"&&v.guests!==0)||(v.attendance==="yes"&&v.guests<1)){
    ctx.addIssue({code:"custom",path:["guests"],message:"INVALID_RSVP_GUEST_COUNT"});
  }
});
export {parseInput,pagingInput};
