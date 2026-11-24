"use client";

import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {CalendarDays,Check,Copy,Eye,LayoutDashboard,LogOut,Mail,RefreshCw,Settings,Users,X} from "lucide-react";
import {useCustomerSession} from "@/features/auth/browser/use-customer-session";
import {CustomerSignIn} from "./customer-sign-in";
import {customerApi,unpublishCustomerInvitation,
  type CustomerDraftListItem,type CustomerPublication} from "@/features/invitations/customer-cloud";
import type {Locale} from "@/i18n/locales";
import {BrandWordmark} from "@/components/brand/brand-wordmark";
import {publicFont} from "@/components/layout/public-font";
import "@/app/landing-editorial.css";
import "./customer-invitations-dashboard.css";

type Summary={responses:number;attending:number;declined:number};
type Reply={id:string;guestName:string;attendance:"YES"|"NO";guestCount:number;wish?:string|null;createdAt:string};
type ReplyPage={items:Reply[];nextPage:number|null};
type Entry={draft:CustomerDraftListItem;publication:CustomerPublication|null;summary:Summary|null};
type Overview={
  totals:Summary&{drafts:number;active:number};
  entries:Entry[];
  recent:Array<Reply&{draftId:string;invitation:string}>;
  nextPage:number|null;
};
const sections=[
  {id:"overview",icon:LayoutDashboard,ru:"Обзор",ky:"Обзор"},
  {id:"invitations",icon:Mail,ru:"Приглашения",ky:"Чакыруулар"},
  {id:"guests",icon:Users,ru:"Гости",ky:"Коноктор"},
  {id:"profile",icon:Settings,ru:"Профиль",ky:"Профиль"},
] as const;
type Section=typeof sections[number]["id"];

export function CustomerInvitationsDashboard({locale}:{locale:Locale}){
  const session=useCustomerSession();
  return <InvitationsDashboard key={session.user?.id??session.status} locale={locale} session={session}/>;
}

function InvitationsDashboard({locale,session}:{locale:Locale;session:ReturnType<typeof useCustomerSession>}){
  const ru=locale==="ru";
  const signedIn=session.status==="signed-in";
  const [overview,setOverview]=useState<Overview|null>(null);
  const [section,setSection]=useState<Section>("overview");
  const [page,setPage]=useState(1);
  const entries=overview?.entries??[];
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [expanded,setExpanded]=useState<string|null>(null);
  const [replies,setReplies]=useState<Record<string,Reply[]>>({});
  const [next,setNext]=useState<Record<string,number|null>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [signingOut,setSigningOut]=useState(false);
  const refresh=useCallback(async (signal?:AbortSignal)=>{
    if(!signedIn)return;
    try{
      const result=await customerApi<Overview>(
        "/customer/account/overview?page="+page,"GET",undefined,signal);
      if(!signal?.aborted)setOverview(result);
    }catch{
      if(!signal?.aborted)setError(ru?"Не удалось загрузить приглашения. Повторите попытку.":"Чакырууларды жүктөө мүмкүн болгон жок.");
    }finally{if(!signal?.aborted)setLoading(false);}
  },[signedIn,ru,page]);
  useEffect(()=>{
    const controller=new AbortController();
    void Promise.resolve().then(()=>{
      if(!controller.signal.aborted)return refresh(controller.signal);
    });
    return ()=>controller.abort();
  },[refresh]);

  async function signOut() {
    if (!session.client || signingOut) return;
    setSigningOut(true);
    try {
      const {error:failure} = await session.client.auth.signOut({scope:"local"});
      if (failure) throw failure;
    } catch {
      setError(ru?"Не удалось выйти. Повторите попытку.":"Чыгуу мүмкүн болгон жок. Кайра аракет кылыңыз.");
    } finally {
      setSigningOut(false);
    }
  }

  async function showReplies(id:string,page=1){
    setBusy(id);setError("");
    try{
      const result=await customerApi<ReplyPage>(
        "/customer/invitations/"+encodeURIComponent(id)+"/rsvp?page="+page+"&limit=20");
      setReplies(prev=>({...prev,[id]:page===1?result.items:[...(prev[id]??[]),...result.items]}));
      setNext(prev=>({...prev,[id]:result.nextPage}));
      setExpanded(id);
    }catch{setError(ru?"Не удалось загрузить ответы гостей.":"Коноктордун жооптору жүктөлгөн жок.");}
    finally{setBusy(null);}
  }
  async function hide(entry:Entry){
    if(!entry.publication||entry.publication.status!=="ACTIVE")return;
    if(!window.confirm(ru?"Закрыть приглашение для гостей?":"Коноктор үчүн чакырууну жабасызбы?"))return;
    setBusy(entry.draft.id);
    try{
      await unpublishCustomerInvitation(entry.draft.id,entry.publication.latestRelease);
      await refresh();
    }catch{setError(ru?"Не удалось закрыть приглашение.":"Чакырууну жабуу мүмкүн болгон жок.");}
    finally{setBusy(null);}
  }
  async function copy(slug:string){
    try{await navigator.clipboard.writeText(location.origin+"/"+locale+"/c/"+slug);}
    catch{setError(ru?"Не удалось скопировать ссылку.":"Шилтемени көчүрүү мүмкүн болгон жок.");}
  }
  const title=section==="guests"?(ru?"Ответы гостей":"Коноктордун жооптору"):
    section==="profile"?"Профиль":(ru?"Мои приглашения":"Менин чакырууларым");
  const switchPage=(number:number)=>{setLoading(true);setError("");setPage(number);};
  return <div className={`ci-page invito-landing ${publicFont.variable}`}>
    <header className="ci-top">
      <BrandWordmark locale={locale}/>
      <Link className="ci-top-link" href={`/${locale}/templates`}>{ru?"Шаблоны":"Шаблондор"}</Link>
      <nav className="ci-locales" aria-label={ru?"Язык":"Тил"}>
        {(["ru","ky"] as const).map(lang=><Link key={lang} href={`/${lang}/account`} lang={lang}
          aria-current={lang===locale?"page":undefined}>{lang.toUpperCase()}</Link>)}
      </nav>
    </header>
    {signedIn&&<nav className="ci-tabs" aria-label={ru?"Личный кабинет":"Жеке кабинет"}>
      {sections.map(({id,icon:Icon,...label})=><button type="button" key={id}
        aria-current={section===id?"page":undefined} onClick={()=>setSection(id)}><Icon size={20}/>{label[locale]}</button>)}
    </nav>}
    <main className="ci-content">
    {!(signedIn&&section==="profile")?<><div className="ci-heading">
      <div><h1>{title}</h1>{section!=="guests"&&<p>{ru?"Редактируйте приглашения и следите за ответами гостей.":"Чакырууларды түзөтүп, коноктордун жоопторун караңыз."}</p>}</div>
      <Link className="ci-new" href={`/${locale}/templates`}>{ru?"Создать приглашение":"Чакыруу түзүү"}</Link>
    </div>
      {session.status==="loading"?<section className="ci-empty" role="status">{ru?"Проверяем вход…":"Кирүү текшерилүүдө…"}</section>:
      !session.config||!session.client?<section className="ci-empty">{ru?"Вход в кабинет сейчас недоступен.":"Кабинетке кирүү азыр жеткиликсиз."}</section>:
      !signedIn?<section className="ci-empty">
        <Users size={30}/><h2>{ru?"Войдите в Eventiq":"Eventiq аккаунтуна кириңиз"}</h2>
        <p>{ru?"Войдите, чтобы увидеть свои черновики и ответы гостей.":"Черновиктерди жана коноктордун жоопторун көрүү үчүн кириңиз."}</p>
        <CustomerSignIn locale={locale} client={session.client} className="ci-login"/>
      </section>:loading?<section className="ci-empty" role="status">{ru?"Загружаем приглашения…":"Чакыруулар жүктөлүүдө…"}</section>:
      <>
      {section==="overview"&&overview&&<dl className="ci-overview">
        <div><dt>{ru?"Черновики":"Черновиктер"}</dt><dd>{overview.totals.drafts}</dd></div>
        <div><dt>{ru?"Опубликовано":"Жарыяланды"}</dt><dd>{overview.totals.active}</dd></div>
        <div><dt>{ru?"Гостей подтвердили":"Келе турган коноктор"}</dt><dd>{overview.totals.attending}</dd></div>
        <div><dt>{ru?"Отказались":"Келе албайт"}</dt><dd>{overview.totals.declined}</dd></div>
      </dl>}
      {entries.length===0&&!error?<section className="ci-empty"><CalendarDays size={30}/>
        <h2>{ru?"Пока нет приглашений":"Азырынча чакыруулар жок"}</h2>
        <p>{ru?"Выберите готовый дизайн, добавьте фотографии и опубликуйте страницу.":"Дизайн тандап, сүрөт кошуп, баракчаны жарыялаңыз."}</p>
        <Link href={`/${locale}/templates`}>{ru?"Выбрать дизайн":"Дизайн тандоо"}</Link>
      </section>:
      <div className="ci-grid">{entries.map(entry=>{
        const {draft,publication,summary}=entry;
        const isActive=publication?.status==="ACTIVE";
        const slug=draft.templateVersion.template.publicSlug;
        return <article className="ci-card" key={draft.id}>
          <div className="ci-card-head"><span className={isActive?"ci-status ci-active":"ci-status"}>{isActive?
            ru?"Опубликовано":"Жарыяланган":publication?(ru?"Закрыто":"Жабылган"):"Черновик"}</span>
            <span className="ci-date">{new Date(draft.updatedAt).toLocaleDateString(ru?"ru-RU":"ky-KG")}</span>
          </div>
          <h2>{draft.templateVersion.template.name}</h2>
          <div className="ci-stats">
            <div><Users size={16}/><strong>{summary?.responses??0}</strong><small>{ru?"Ответов":"Жооп"}</small></div>
            <div><Check size={16}/><strong>{summary?.attending??0}</strong><small>{ru?"Придут":"Келет"}</small></div>
            <div><X size={16}/><strong>{summary?.declined??0}</strong><small>{ru?"Не придут":"Келбейт"}</small></div>
          </div>
          <div className="ci-actions">
            {slug&&<Link href={`/${locale}/editor?template=${encodeURIComponent(slug)}&draft=${encodeURIComponent(draft.id)}`}>{ru?"Редактировать":"Түзөтүү"}</Link>}
            {isActive&&<a target="_blank" rel="noopener noreferrer" href={`/${locale}/c/${publication.slug}`}><Eye size={15}/>{ru?"Открыть":"Ачуу"}</a>}
            {isActive&&<button type="button" onClick={()=>void copy(publication.slug)}><Copy size={15}/>{ru?"Ссылка":"Шилтеме"}</button>}
          </div>
          {publication&&<div className="ci-secondary-actions">
            <button type="button" disabled={busy===draft.id} onClick={()=>expanded===draft.id?setExpanded(null):void showReplies(draft.id)}>
              <Users size={15}/>{expanded===draft.id?(ru?"Скрыть гостей":"Жашыруу"):(ru?"Список гостей":"Коноктор")}
            </button>
            {isActive&&<button type="button" disabled={busy===draft.id} onClick={()=>void hide(entry)}>{ru?"Закрыть доступ":"Кирүүнү жабуу"}</button>}
          </div>}
          {expanded===draft.id&&<div className="ci-replies">
            {(replies[draft.id]??[]).length===0?<p>{ru?"Ответов пока нет.":"Азырынча жооп жок."}</p>:
            (replies[draft.id]??[]).map(reply=><div key={reply.id} className="ci-reply">
              <span>{reply.guestName}</span><small>{reply.attendance==="YES"?(ru?"Придёт":"Келет"):(ru?"Не придёт":"Келбейт")} · {reply.guestCount}</small>{reply.wish&&<p>{reply.wish}</p>}
            </div>)}
            {next[draft.id]&&<button disabled={busy===draft.id} onClick={()=>void showReplies(draft.id,next[draft.id]??1)}>{ru?"Ещё ответы":"Дагы жооптор"}</button>}
          </div>}
        </article>;
      })}</div>}
      {section!=="invitations"&&overview?.recent.length? <section className="ci-recent" aria-labelledby="ci-recent-title">
        <h2 id="ci-recent-title">{ru?"Последние ответы":"Акыркы жооптор"}</h2>
        <ul>{overview.recent.map(reply=><li key={reply.id}>
          <div><strong>{reply.guestName}</strong><small>{reply.invitation}</small></div>
          <span className={reply.attendance==="YES"?"ci-status ci-active":"ci-status"}>
            {reply.attendance==="YES"?(ru?"Придёт":"Келет"):(ru?"Не придёт":"Келбейт")}
          </span>
          {reply.attendance==="YES"&&<span aria-label={ru?"Количество гостей":"Коноктордун саны"}>
            <Users size={16}/>{reply.guestCount}
          </span>}
        </li>)}</ul>
      </section>:null}
      {overview&&(page>1||overview.nextPage)&&<nav className="ci-pagination" aria-label={ru?"Страницы приглашений":"Чакыруу барактары"}>
        <button type="button" className="ci-refresh" disabled={page<=1} onClick={()=>switchPage(page-1)}>{ru?"Назад":"Артка"}</button>
        <span>{page}</span>
        <button type="button" className="ci-refresh" disabled={!overview.nextPage} onClick={()=>switchPage(overview.nextPage??page)}>{ru?"Далее":"Кийинки"}</button>
      </nav>}
      </>}
      {signedIn&&<button type="button" className="ci-refresh ci-reload" disabled={loading} onClick={()=>{
        setLoading(true);setError("");void refresh();
      }}><RefreshCw size={17}/>{ru?"Обновить":"Жаңыртуу"}</button>}
      </>:<section className="ci-profile">
        <h1>{title}</h1>
        <dl><dt>Email</dt><dd>{session.user?.email}</dd></dl>
        <button className="ci-refresh" type="button" disabled={signingOut} onClick={()=>void signOut()}>
          <LogOut size={16}/>{ru?"Выйти":"Чыгуу"}
        </button>
      </section>}
      {error&&<p className="ci-error" role="alert">{error}</p>}
    </main>
  </div>;
}
