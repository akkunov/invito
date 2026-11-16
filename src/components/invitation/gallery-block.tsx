import Image from "next/image";
import type { InvitationDocument } from "@/features/invitations/invitation.schema";

/** Shared gallery: one source of truth for editor, birthday and wedding previews. */
export function GalleryBlock({ document }: { document: InvitationDocument }) {
  const photos = document.media?.galleryDataUrls?.slice(0, 4) ?? [];
  const isRu = document.locale === "ru";
  return (
    <section data-editor-block="gallery" className="invite-gallery-section" aria-label={isRu ? "Фотогалерея" : "Сүрөт галереясы"}>
      <p className="invite-section-kicker">{isRu ? "Наши моменты" : "Биздин көз ирмемдер"}</p>
      <h3>{isRu ? "Фотогалерея" : "Сүрөт галереясы"}</h3>
      {photos.length ? (
        <div className="invite-gallery-grid">
          {photos.map((src, index) => (
            <figure className="invite-gallery-photo" key={`${index}-${src.length}`}>
              <Image src={src} alt={isRu ? `Фотография ${index + 1}` : `${index + 1}-сүрөт`} fill sizes="(max-width: 600px) 70vw, 280px" unoptimized />
            </figure>
          ))}
        </div>
      ) : (
        <p className="invite-gallery-empty">{isRu ? "Добавьте фотографии во вкладке «Фотогалерея» редактора" : "Редактордун «Сүрөт галереясы» бөлүмүнө сүрөт кошуңуз"}</p>
      )}
    </section>
  );
}
