import { nationalTemplates } from "@/features/invitations/national-templates";
import { collectionTemplates } from "@/features/invitations/collection-templates";
import { editorialTemplates } from "@/features/invitations/editorial-templates";
import { referenceTemplates } from "@/features/invitations/reference-templates";
import { birthdayTemplates } from "@/features/invitations/birthday-templates";
import type { TemplateDefinition, TemplateCategory } from "@/features/invitations/template.types";

export const categories: readonly { id: TemplateCategory; name: { ru: string; ky: string } }[] = [
  { id: "wedding", name: { ru: "Свадьба", ky: "Үйлөнүү той" } },
  { id: "kyz-uzatuu", name: { ru: "Кыз узатуу", ky: "Кыз узатуу" } },
  { id: "beshik-toi", name: { ru: "Бешик той", ky: "Бешик той" } },
  { id: "birthday", name: { ru: "День рождения", ky: "Туулган күн" } },
  { id: "anniversary", name: { ru: "Юбилей", ky: "Маараке" } },
  { id: "nike", name: { ru: "Нике кыюу", ky: "Нике кыюу" } },
  { id: "tushoo", name: { ru: "Тушоо кесүү", ky: "Тушоо кесүү" } },
  { id: "sunnot", name: { ru: "Сүннөт той", ky: "Сүннөт той" } },
  { id: "corporate", name: { ru: "Корпоратив", ky: "Корпоратив" } },
];

export const templates: readonly TemplateDefinition[] = [
  ...birthdayTemplates,
  ...editorialTemplates,
  ...collectionTemplates,
  ...nationalTemplates,
  ...referenceTemplates,
];

export function findTemplateById(id: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === id);
}
