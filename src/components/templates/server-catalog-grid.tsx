import Link from "next/link";
import type {Locale} from "@/i18n/locales";
import {catalogCategoryLabels, type CatalogItem} from "@/features/invitations/server-catalog";

export function ServerCatalogGrid({locale,items}:{locale:Locale;items:CatalogItem[]}){
  return <section aria-labelledby="server-catalog-title" style={{marginBlock:"28px 44px"}}>
    <div className="ed-section-heading">
      <div>
        <p className="ed-eyebrow">EVENTIQ / CLOUD COLLECTION</p>
        <h2 id="server-catalog-title">{locale==="ru"?"Новые шаблоны":"Жаңы шаблондор"}</h2>
      </div>
    </div>
    <div className="catalog-grid">
      {items.map(item=><article key={item.id} className="template-card">
        <Link href={`/${locale}/catalog/${item.slug}`} className="template-card-link"
          style={{display:"block",aspectRatio:"3 / 4",borderRadius:12,overflow:"hidden",background:"#F0E9DF"}}
          aria-label={`${locale==="ru"?"Посмотреть":"Көрүү"}: ${item.name}`}>
          {item.coverUrl?
            <div aria-hidden="true" style={{width:"100%",height:"100%",backgroundImage:`url("${item.coverUrl}")`,backgroundPosition:"center",backgroundSize:"cover"}}/>:
            <div style={{width:"100%",height:"100%",display:"grid",placeItems:"center",padding:24,textAlign:"center",color:"#24201B"}}>
              <span style={{fontSize:"clamp(1.5rem,4vw,2.5rem)",lineHeight:1.1}}>{item.name}</span>
            </div>}
        </Link>
        <div className="template-card-meta">
          <h3><Link href={`/${locale}/catalog/${item.slug}`}>{item.name}</Link></h3>
          <span>{catalogCategoryLabels[item.category][locale]}</span>
        </div>
      </article>)}
    </div>
  </section>;
}
