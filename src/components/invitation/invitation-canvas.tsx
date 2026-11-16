import { SantoriniInvitation } from "@/components/invitation/santorini-invitation";
import { MonochromeInvitation } from "@/components/invitation/monochrome-invitation";
import { RivieraInvitation } from "@/components/invitation/riviera-invitation";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

export function InvitationCanvas({ document, musicSrc }: {
  document: InvitationDocument;
  musicSrc?: string | null;
  musicName?: string;
}) {
  if (document.templateId === "wedding-travel-santorini") return <SantoriniInvitation document={document} musicSrc={musicSrc}/>;
  if (document.templateId === "editorial-monochrome-wedding") return <MonochromeInvitation document={document} musicSrc={musicSrc}/>;
  if (document.templateId !== "editorial-riviera-wedding") return null;
  return <RivieraInvitation document={document} musicSrc={musicSrc}/>;
}
