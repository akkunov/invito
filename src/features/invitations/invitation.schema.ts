import { z } from "zod";

export const localizedTextSchema = z.object({
  ru: z.string().max(500),
  ky: z.string().max(500),
});

export const blockKindSchema = z.enum([
  "cover", "message", "countdown", "details", "location", "gallery", "rsvp",
]);

export const invitationBlockSchema = z.object({
  id: blockKindSchema,
  enabled: z.boolean(),
});

export const invitationDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  templateId: z.string().min(1),
  locale: z.enum(["ru", "ky"]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  content: z.object({
    name1: z.string().max(100),
    age: z.number().int().min(1).max(120).optional(),
    name2: z.string().max(100),
    title: localizedTextSchema,
    message: localizedTextSchema,
    venue: localizedTextSchema,
    city: localizedTextSchema,
    dateTimeLocal: z.string().max(16),
    timezone: z.literal("Asia/Bishkek"),
  }),
  media: z.object({
    portraitDataUrl: z.string().regex(/^data:image\/(jpeg|webp);base64,/).max(1800000).nullable(),
    focalY: z.number().min(0).max(100),
    galleryDataUrls: z.array(z.string().regex(/^data:image\/(jpeg|webp);base64,/).max(1000000)).max(3),
  }).optional(),
  blocks: z.array(invitationBlockSchema).min(1).max(7),
});

export type BlockKind = z.infer<typeof blockKindSchema>;
export type InvitationDocument = z.infer<typeof invitationDocumentSchema>;
export type InvitationContent = InvitationDocument["content"];

// Draft documents may contain incomplete fields. Publishing must validate them strictly.
export const invitationPublishSchema = invitationDocumentSchema.superRefine((document, context) => {
  if (!document.content.name1.trim()) {
    context.addIssue({ code: "custom", path: ["content", "name1"], message: "First name is required" });
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(document.content.dateTimeLocal)) {
    context.addIssue({ code: "custom", path: ["content", "dateTimeLocal"], message: "Valid event date is required" });
  }
  for (const key of ["title", "message", "venue", "city"] as const) {
    for (const locale of ["ru", "ky"] as const) {
      if (!document.content[key][locale].trim()) {
        context.addIssue({ code: "custom", path: ["content", key, locale], message: `${key} (${locale}) is required` });
      }
    }
  }
});
