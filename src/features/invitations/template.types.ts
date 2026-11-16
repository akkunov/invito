import type { InvitationDocument } from "@/features/invitations/invitation.schema";
export type TemplateCategory = "wedding";
export type TemplateTheme = "editorial-riviera" | "editorial-monochrome";
export interface TemplateDefinition {
  id: string;
  category: TemplateCategory;
  theme: TemplateTheme;
  premium: boolean;
  name: { ru: string; ky: string };
  description: { ru: string; ky: string };
  accent: string;
  defaultContent: InvitationDocument["content"];
  defaultProgram?: InvitationDocument["program"];
}
