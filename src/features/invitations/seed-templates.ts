import { rivieraTemplate } from "@/features/invitations/riviera-template";
import type { TemplateDefinition, TemplateCategory } from "@/features/invitations/template.types";

export const categories: readonly { id: TemplateCategory; name: { ru: string; ky: string } }[] = [
  { id: "wedding", name: { ru: "Свадьба", ky: "Үйлөнүү той" } },
];

export const templates: readonly TemplateDefinition[] = [rivieraTemplate];

export function findTemplateById(id: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === id);
}
