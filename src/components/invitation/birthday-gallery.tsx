import Image from "next/image";
import type {InvitationDocument} from "@/features/invitations/invitation.schema";

export function BirthdayGallery({document}: { document: InvitationDocument }) {
    const photos = document.media?.galleryDataUrls ?? [];
    if (!photos.length) return null;
    return <section className="bd-gallery" aria-label={document.locale === "ru" ? "Фотогалерея" : "Сүрөттөр"}>
        <p className="bd-overline" data-birthday-reveal>{document.locale === "ru" ? "Воспоминания" : "Эскерүүлөр"}</p>
        <h3 data-birthday-reveal>{document.locale === "ru" ? "Моменты жизни" : "Өмүрдүн көз ирмемдери"}</h3>
        <div className="bd-gallery-list">{photos.map((src, index) => <div key={`${index}-${src.slice(-12)}`}
                                                                          className="bd-gallery-image"
                                                                          data-birthday-reveal>
            <Image src={src} fill sizes="(max-width: 650px) 65vw, 260px" unoptimized
                   alt={document.locale === "ru" ? `Фото ${index + 1}` : `${index + 1}-сүрөт`}/>
        </div>)}</div>
    </section>;
}
