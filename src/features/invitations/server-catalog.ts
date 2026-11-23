/** Server-side public catalog. Never attach Supabase tokens to these requests. */
export type CatalogItem={
  id:string;slug:string;name:string;description:string;
  category:"WEDDING"|"KYZ_UZATUU"|"BIRTHDAY"|"ANNIVERSARY"|"CORPORATE"|"OTHER";
  tags:string[];version:number;coverUrl:string|null;updatedAt:string;
};
export type CatalogList={items:CatalogItem[];total:number;page:number;limit:number;nextPage:number|null};
export type CatalogDetail=Omit<CatalogItem,"tags"|"coverUrl"|"updatedAt">&{
  templateVersionId:string;document:unknown;personalization:unknown;
  mediaUrls:Record<string,string>;
};
function apiBase(){
  const raw=process.env.API_INTERNAL_URL||process.env.NEXT_PUBLIC_API_URL||"http://localhost:4000/api/v1";
  const url=new URL(raw);
  if(url.username||url.password||url.search||url.hash||
    !["https:","http:"].includes(url.protocol)||
    (url.protocol==="http:"&&!["localhost","127.0.0.1"].includes(url.hostname)))throw Error("INVALID_CATALOG_API_BASE");
  return url.href.replace(/\/$/,"");
}
export async function getPublicCatalog(filters:{search?:string;category?:string;page?:number;limit?:number}={}):Promise<CatalogList>{
  const query=new URLSearchParams();
  if(filters.search)query.set("search",filters.search.slice(0,100));
  if(filters.category)query.set("category",filters.category);
  query.set("page",String(filters.page??1));
  query.set("limit",String(filters.limit??24));
  const response=await fetch(apiBase()+"/catalog/templates?"+query,{cache:"no-store"});
  if(!response.ok)throw Error("CATALOG_HTTP_"+response.status);
  return await response.json() as CatalogList;
}
export async function getPublicTemplate(slug:string):Promise<CatalogDetail|null>{
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)return null;
  const response=await fetch(apiBase()+"/catalog/templates/"+encodeURIComponent(slug),{cache:"no-store"});
  if(response.status===404)return null;
  if(!response.ok)throw Error("CATALOG_TEMPLATE_HTTP_"+response.status);
  return await response.json() as CatalogDetail;
}
