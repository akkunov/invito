import { publicFont } from "@/components/layout/public-font";
import "@/app/landing-editorial.css";
import type {Metadata} from "next";
import Link from "next/link";
import {CatalogSearch} from "@/components/templates/catalog-search";
import {SiteHeader} from "@/components/layout/site-header";
import {SiteFooter} from "@/components/layout/site-footer";
import {TemplateCard} from "@/components/templates/template-card";
import {routes} from "@/constants/routes";
import {templates, categories} from "@/features/invitations/seed-templates";
import {getDictionary} from "@/i18n/dictionaries";
import {isLocale} from "@/i18n/locales";
import {notFound} from "next/navigation";

interface SearchFilters {
    search?: string;
    category?: string;
    price?: string
}

export async function generateMetadata({params}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const {locale} = await params;
    if (!isLocale(locale)) notFound();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return {
        title: getDictionary(locale).seo.catalog,
        description: getDictionary(locale).catalog.description,
        alternates: {
            canonical: `${siteUrl}/${locale}/templates`,
            languages: {ru: `${siteUrl}/ru/templates`, ky: `${siteUrl}/ky/templates`}
        },
    };
}

export default async function TemplatesPage({params, searchParams}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<SearchFilters>
}) {
    const {locale} = await params;
    if (!isLocale(locale)) notFound();
    const filters = await searchParams;
    const dict = getDictionary(locale);
    const search = (filters.search ?? "").trim().toLocaleLowerCase();
    const filtered = templates.filter((template) => {
        if (filters.category && filters.category !== template.category) return false;
        if (filters.price === "free" && template.premium) return false;
        if (filters.price === "premium" && !template.premium) return false;
        return !search || `${template.name.ru} ${template.name.ky} ${template.description.ru} ${template.description.ky}`.toLocaleLowerCase().includes(search);
    });
    return <div className={`invito-landing ${publicFont.variable}`}><SiteHeader locale={locale}/>
        <main className="catalog-main page-container">
            <div className="catalog-intro">
                <div><h1>{dict.catalog.title}</h1><p>{dict.catalog.description}</p></div>
                <span className="catalog-total">{templates.length}</span></div>
            <form noValidate action={routes.templates(locale)} method="get" className="catalog-toolbar">
                <CatalogSearch key={filters.search ?? ""} initialValue={filters.search ?? ""} label={dict.catalog.search}
                  clearLabel={locale === "ru" ? "Очистить поиск" : "Издөөнү тазалоо"}/>
                <label className="filter-select"><span className="sr-only">{dict.catalog.category}</span><select
                    name="category" defaultValue={filters.category ?? ""}>
                    <option value="">{dict.catalog.all}</option>
                    {categories.map((category) => <option key={category.id}
                                                          value={category.id}>{category.name[locale]}</option>)}
                </select></label>
                <label className="filter-select"><span
                    className="sr-only">{locale === "ru" ? "Цена" : "Баасы"}</span><select name="price"
                                                                                           defaultValue={filters.price ?? ""}>
                    <option value="">{dict.actions.all}</option>
                    <option value="free">{dict.catalog.free}</option>
                    <option value="premium">{dict.catalog.premium}</option>
                </select></label>
                <button className="button-primary" type="submit">{locale === "ru" ? "Найти" : "Издөө"}</button>
            </form>
            <div className="catalog-summary">
                <span>{locale === "ru" ? "Найдено" : "Табылды"}: {filtered.length}</span>{(filters.search || filters.category || filters.price) &&
                <Link href={routes.templates(locale)}>{dict.catalog.emptyAction}</Link>}</div>
            {filtered.length ? <div className="catalog-grid">{filtered.map((template) => <TemplateCard locale={locale}
                                                                                                       key={template.id}
                                                                                                       template={template}/>)}</div> :
                <div className="catalog-empty"><h2>{dict.catalog.noResults}</h2><Link className="button-outline"
                                                                                      href={routes.templates(locale)}>{dict.catalog.emptyAction}</Link>
                </div>}
        </main>
        <SiteFooter locale={locale}/></div>;
}
