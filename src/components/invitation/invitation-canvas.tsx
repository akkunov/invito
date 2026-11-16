import { RivieraInvitation } from "@/components/invitation/riviera-invitation";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

export function InvitationCanvas({ document, musicSrc }: {
  document: InvitationDocument;
  musicSrc?: string | null;
  musicName?: string;
}) {
  if (document.templateId !== "editorial-riviera-wedding") return null;
  return <RivieraInvitation document={document} musicSrc={musicSrc}/>;
}
