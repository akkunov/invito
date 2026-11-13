import { Check } from "lucide-react";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

export function FeatureSection({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section id="features" className="features-section page-container" aria-labelledby="features-title">
      <div className="feature-art" aria-hidden="true"><div className="feature-art-card"><span>Азамат & Айпери</span><i>20.06.2027</i></div></div>
      <div className="feature-copy"><h2 id="features-title">{dict.landing.featureTitle}</h2><ul>{dict.landing.features.map((feature) => <li key={feature}><Check size={19} strokeWidth={2} aria-hidden="true" />{feature}</li>)}</ul></div>
    </section>
  );
}
