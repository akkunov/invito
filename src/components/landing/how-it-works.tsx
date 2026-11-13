import { BookOpen, SlidersHorizontal, Eye, Send } from "lucide-react";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function HowItWorks({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const steps = [dict.landing.step1, dict.landing.step2, dict.landing.step3, dict.landing.step4];
  const icons = [BookOpen, SlidersHorizontal, Eye, Send];
  return (
    <section id="how" className="how-section page-container" aria-labelledby="how-title">
      <h2 id="how-title">{dict.landing.how}</h2>
      <ol className="steps-list">{steps.map((step, index) => {
        const Icon = icons[index];
        return <li key={step}><span className="step-icon"><Icon size={24} strokeWidth={1.6} aria-hidden="true" /></span><span className="step-index">0{index + 1}</span><h3>{step}</h3></li>;
      })}</ol>
    </section>
  );
}
