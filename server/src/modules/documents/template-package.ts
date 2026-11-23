import {z} from "zod";
import {createTemplateInput} from "./documents-input.js";

/**
 * Server-importable JSON package v1. Media bytes are never embedded in JSON:
 * upload them first through the authenticated Workspace R2 flow and reference
 * READY asset:UUID keys in the document. Import does not grant public visibility.
 */
export const templatePackageSchema = z.strictObject({
  format: z.literal("eventiq-template"),
  version: z.literal(1),
  manifest: createTemplateInput.omit({document:true,personalization:true}),
  document: z.unknown(),
  personalization: z.unknown(),
});

export type TemplatePackageV1 = z.output<typeof templatePackageSchema>;
