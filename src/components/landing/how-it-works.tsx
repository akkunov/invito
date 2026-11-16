import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/locales";

export function HowItWorks({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const steps = ru ? [
    { num: "01", title: "Найдите своё", description: "Выберите приглашение, которое подходит вашей истории." },
    { num: "02", title: "Добавьте детали", description: "Имена, фотографии, программу, место и музыку — всё важное." },
    { num: "03", title: "Посмотрите результат", description: "Проверьте приглашение с телефона, настройте каждую деталь." },
    { num: "04", title: "Сохраните черновик", description: "Изменения пока сохраняются в вашем браузере; публикация появится позже." },
  ] : [
    { num: "01", title: "Жакканын табыңыз", description: "Окуяңызга дал келген чакыруу дизайнын тандаңыз." },
    { num: "02", title: "Маалымат кошуңуз", description: "Ысымдар, сүрөттөр, программа, дарек жана музыка." },
    { num: "03", title: "Натыйжаны көрүңүз", description: "Телефондон карап, ар бир деталды текшериңиз." },
    { num: "04", title: "Сомдомону сактаңыз", description: "Өзгөртүүлөр азыр браузерде сакталат; жарыялоо кийин жеткиликтүү болот." },
  ];
  return <section id="how" className="ed-process page-container" aria-labelledby="ed-process-title">
    <div className="ed-section-heading">
      <div><p className="ed-eyebrow">{ru ? "ОТ ИДЕИ К ПРИГЛАШЕНИЮ" : "ИДЕЯДАН ЧАКЫРУУГА"}</p><h2 id="ed-process-title">{ru ? <>Красиво.<br/><em>И просто.</em></> : <>Кооз.<br/><em>Жана оңой.</em></>}</h2></div>
      <p className="ed-heading-aside">{ru ? "Никаких сложных инструментов. Только ваши слова, фотографии и немного вдохновения." : "Татаал куралдар жок. Болгону сөздөрүңүз, сүрөттөрүңүз жана илхам."}</p>
    </div>
    <ol className="ed-process-list">{steps.map(step=><li key={step.num}>
      <span className="ed-step-no">{step.num}</span>
      <div><h3>{step.title}</h3><p>{step.description}</p></div>
      <ArrowUpRight size={19} strokeWidth={1.3} aria-hidden="true"/>
    </li>)}</ol>
  </section>;
}
