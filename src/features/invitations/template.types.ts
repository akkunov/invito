import type { EditorialVariant } from "@/features/invitations/editorial-templates";
import type { ReferenceTheme } from "@/features/invitations/reference-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

export type TemplateCategory =
  | "wedding"
  | "kyz-uzatuu"
  | "beshik-toi"
  | "birthday"
  | "anniversary"
  | "nike"
  | "tushoo"
  | "sunnot"
  | "corporate";

export type TemplateTheme =
  | "sunset"
  | "ivory"
  | "jade"
  | "sakura"
  | "honey"
  | "noir"
  | "sky"
  | "gold"
  | "mint"
  | "azure"
  | "mono"
  | "garden"
  | "birthday-midnight"
  | "birthday-bloom"
  | "birthday-milestone"
  | ReferenceTheme
  | `editorial-${EditorialVariant}`
  | "editorial-riviera";

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
