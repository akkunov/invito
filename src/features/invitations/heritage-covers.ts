import { nationalCoverOptions } from "@/features/invitations/national-templates";

/** Template-specific ornaments only; separate interchangeable cover gallery removed. */
export const heritageCovers = nationalCoverOptions;
export function getHeritageCover(id: string | null | undefined) {
  return heritageCovers.find((cover) => cover.id === id) ?? null;
}
