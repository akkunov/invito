import Image from "next/image";
import type { BirthdayVariant } from "@/features/invitations/birthday-templates";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

const demoImages: Record<BirthdayVariant, string> = {
  midnight: "/images/birthday/midnight-demo.jpg",
  bloom: "/images/birthday/bloom-demo.jpg",
  milestone: "/images/birthday/milestone-demo.jpg",
};

export function BirthdayPhoto({ document, variant, className = "" }: {
  document: InvitationDocument;
  variant: BirthdayVariant;
  className?: string;
}) {
  const userImage = document.media?.portraitDataUrl;
  return <div className={`bd-photo ${className}`}>
    <Image
      src={userImage ?? demoImages[variant]}
      alt={document.locale === "ru" ? `Портрет: ${document.content.name1}` : `${document.content.name1} — сүрөтү`}
      fill
      sizes="(max-width: 600px) 100vw, 440px"
      fetchPriority="high"
      unoptimized={Boolean(userImage)}
      style={{ objectPosition: `center ${document.media?.focalY ?? 50}%` }}
    />
  </div>;
}
