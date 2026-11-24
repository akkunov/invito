import { publicFont } from "@/components/layout/public-font";
import "@/app/landing-editorial.css";
import type {Metadata} from "next";
import Link from "next/link";
import {CatalogSearch} from "@/components/templates/catalog-search";
import {SiteHeader} from "@/components/layout/site-header";
import {SiteFooter} from "@/components/layout/site-footer";
import {TemplateCard} from "@/components/templates/template-card";
import {ServerCatalogGrid} from "@/components/templates/server-catalog-grid";
import {getPublicCatalog, catalogCategoryLabels} from "@/features/invitations/server-catalog";
import {routes} from "@/constants/routes";
import {templates} from "@/features/invitations/seed-templates";
import {getDictionary} from "@/i18n/dictionaries";
import {isLocale} from "@/i18n/locales";
import {notFound} from "next/navigation";

type FilterKey = "search" | "category" | "price" | "page";
type SearchFilters = Partial<Record<FilterKey, string|string[]>>;

function firstParam(value: string|string[]|undefined) {
    return Array.isArray(value) ? value[0] : value;
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
    const raw = await searchParams;
    const category = firstParam(raw.category)?.toLowerCase();
    const categoryId = Object.keys(catalogCategoryLabels).find(key => key.toLowerCase() === category);
    const priceParam = firstParam(raw.price);
    const price = priceParam === "free" || priceParam === "premium" ? priceParam : undefined;
    const searchValue = firstParam(raw.search)?.trim().slice(0, 100);
    const requestedPage = Number(firstParam(raw.page));
    const page = !price && Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1;
    const dict = getDictionary(locale);
    const cloud = price ? undefined : await getPublicCatalog({search:searchValue,category:categoryId,page,limit:12}).catch(() => null);
    const search = searchValue?.toLocaleLowerCase();
    const filtered = templates.filter((template) => {
        if (categoryId && categoryId.toLowerCase() !== template.category) return false;
        if (price === "free" && template.premium) return false;
        if (price === "premium" && !template.premium) return false;
        return !search || `${template.name.ru} ${template.name.ky} ${template.description.ru} ${template.description.ky}`.toLocaleLowerCase().includes(search);
    });
    const resultCount = filtered.length + (cloud?.total ?? 0);
    const catalogHref = routes.templates(locale);
    function catalogPage(number: number) {
        const params = new URLSearchParams();
        if (searchValue) params.set("search", searchValue);
        if (categoryId) params.set("category", categoryId.toLowerCase());
        if (price) params.set("price", price);
        if (number > 1) params.set("page", String(number));
        return catalogHref + (params.size ? "?" + params.toString() : "");
    }
    return <div className={`invito-landing ${publicFont.variable}`}><SiteHeader locale={locale}/>
        <main className="catalog-main page-container">
            <div className="catalog-intro">
                <div><h1>{dict.catalog.title}</h1><p>{dict.catalog.description}</p></div>
                <span className="catalog-total">{resultCount}</span></div>
            <form noValidate action={routes.templates(locale)} method="get" className="catalog-toolbar">
                <CatalogSearch key={searchValue ?? ""} initialValue={searchValue ?? ""} label={dict.catalog.search}
                  clearLabel={locale === "ru" ? "Очистить поиск" : "Издөөнү тазалоо"}/>
                <label className="filter-select"><span className="sr-only">{dict.catalog.category}</span><select
                    name="category" defaultValue={categoryId?.toLowerCase() ?? ""}>
                    <option value="">{dict.catalog.all}</option>
                    {Object.entries(catalogCategoryLabels).map(([id,label])=><option key={id} value={id.toLowerCase()}>{label[locale]}</option>)}
                </select></label>
                <label className="filter-select"><span
                    className="sr-only">{locale === "ru" ? "Цена" : "Баасы"}</span><select name="price"
                                                                                           defaultValue={price ?? ""}>
                    <option value="">{dict.actions.all}</option>
                    <option value="free">{dict.catalog.free}</option>
                    <option value="premium">{dict.catalog.premium}</option>
                </select></label>
                <button className="button-primary" type="submit">{locale === "ru" ? "Найти" : "Издөө"}</button>
            </form>
            {cloud?.items.length ? <ServerCatalogGrid locale={locale} items={cloud.items}/> : null}
            <div className="catalog-summary">
                <span>{locale === "ru" ? "Найдено" : "Табылды"}: {resultCount}</span>
                {(searchValue || categoryId || price) &&
                  <Link href={routes.templates(locale)}>{dict.catalog.emptyAction}</Link>}
            </div>
            {cloud === null && <div className="catalog-summary" role="status">
                <span>{locale==="ru"?"Облачные шаблоны временно недоступны.":"Булуттагы шаблондор убактылуу жеткиликсиз."}</span>
                <a href={catalogPage(page)}>{locale==="ru"?"Повторить":"Кайталоо"}</a>
            </div>}
            {page===1 && filtered.length>0 && <div className="catalog-grid">
                {filtered.map(template=><TemplateCard locale={locale} key={template.id} template={template}/>)}
            </div>}
            {cloud!==null && !cloud?.items.length && !(page===1 && filtered.length) &&
                <div className="catalog-empty"><h2>{dict.catalog.noResults}</h2>
                    <Link className="button-outline" href={routes.templates(locale)}>{dict.catalog.emptyAction}</Link>
                </div>}
            {(cloud?.nextPage || page>1) && <nav className="catalog-summary" aria-label={locale==="ru"?"Страницы каталога":"Каталогдун барактары"}>
                {page>1 && <Link href={catalogPage(page-1)}>{locale==="ru"?"Назад":"Артка"}</Link>}
                <span>{page}</span>
                {cloud?.nextPage && <Link href={catalogPage(cloud.nextPage)}>{locale==="ru"?"Далее":"Кийинки"}</Link>}
            </nav>}
        </main>
        <SiteFooter locale={locale}/></div>;
}
