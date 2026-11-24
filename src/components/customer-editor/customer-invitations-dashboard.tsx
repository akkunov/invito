"use client";

import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {ArrowLeft,CalendarDays,Check,Copy,Eye,LogOut,RefreshCw,Users,X} from "lucide-react";
import {useCustomerSession} from "@/features/auth/browser/use-customer-session";
import {CustomerSignIn} from "./customer-sign-in";
import {customerApi,listCustomerDrafts,getCustomerPublication,unpublishCustomerInvitation,
  type CustomerDraftListItem,type CustomerPublication} from "@/features/invitations/customer-cloud";
import type {Locale} from "@/i18n/locales";
import "./customer-invitations-dashboard.css";

type Summary={responses:number;attending:number;declined:number};
type Reply={id:string;guestName:string;attendance:"YES"|"NO";guestCount:number;wish?:string|null;createdAt:string};
type ReplyPage={items:Reply[];nextPage:number|null};
type Entry={draft:CustomerDraftListItem;publication:CustomerPublication|null;summary:Summary|null};

export function CustomerInvitationsDashboard({locale}:{locale:Locale}){
  const session=useCustomerSession();
  return <InvitationsDashboard key={session.user?.id??session.status} locale={locale} session={session}/>;
}

function InvitationsDashboard({locale,session}:{locale:Locale;session:ReturnType<typeof useCustomerSession>}){
  const ru=locale==="ru";
  const signedIn=session.status==="signed-in";
  const [entries,setEntries]=useState<Entry[]>([]);
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
      const drafts=await listCustomerDrafts(signal);
      const result=await Promise.all(drafts.map(async draft=>{
        const publication=await getCustomerPublication(draft.id,signal);
        const summary=publication?await customerApi<Summary>(
          "/customer/invitations/"+encodeURIComponent(draft.id)+"/rsvp/summary","GET",undefined,signal):null;
        return {draft,publication,summary};
      }));
      if(!signal?.aborted)setEntries(result);
    }catch{
      if(!signal?.aborted)setError(ru?"Не удалось загрузить приглашения. Повторите попытку.":"Чакырууларды жүктөө мүмкүн болгон жок.");
    }finally{if(!signal?.aborted)setLoading(false);}
  },[signedIn,ru]);
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
  return <main className="ci-page">
    <header className="ci-top"><Link href={`/${locale}`} aria-label={ru?"На главную":"Башкы бет"}><ArrowLeft size={20}/></Link>
      <strong>eventiq<span>.</span></strong><Link className="ci-new" href={`/${locale}/templates`}>{ru?"Выбрать шаблон":"Шаблон тандоо"}</Link>
      {signedIn&&<button className="ci-refresh" type="button" disabled={signingOut} onClick={()=>void signOut()}>
        <LogOut size={16}/>{ru?"Выйти":"Чыгуу"}
      </button>}
    </header>
    <div className="ci-content">
      <div className="ci-heading"><div><p>EVENTIQ / ACCOUNT</p>
        <h1>{ru?"Мои приглашения":"Менин чакырууларым"}</h1>
        <span>{ru?"Редактируйте приглашения и следите за ответами гостей.":"Чакырууларды түзөтүп, коноктордун жоопторун караңыз."}</span>
      </div>{signedIn&&<button className="ci-refresh" type="button" disabled={loading} onClick={()=>{
        setLoading(true);setError("");void refresh();
      }}><RefreshCw size={17}/>{ru?"Обновить":"Жаңыртуу"}</button>}</div>
      {session.status==="loading"?<section className="ci-empty" role="status">{ru?"Проверяем вход…":"Кирүү текшерилүүдө…"}</section>:
      !session.config||!session.client?<section className="ci-empty">{ru?"Вход в кабинет сейчас недоступен.":"Кабинетке кирүү азыр жеткиликсиз."}</section>:
      !signedIn?<section className="ci-empty">
        <Users size={30}/><h2>{ru?"Войдите в Eventiq":"Eventiq аккаунтуна кириңиз"}</h2>
        <p>{ru?"Войдите, чтобы увидеть свои черновики и ответы гостей.":"Черновиктерди жана коноктордун жоопторун көрүү үчүн кириңиз."}</p>
        <CustomerSignIn locale={locale} client={session.client} className="ci-login"/>
      </section>:loading?<section className="ci-empty" role="status">{ru?"Загружаем приглашения…":"Чакыруулар жүктөлүүдө…"}</section>:
      entries.length===0?<section className="ci-empty"><CalendarDays size={30}/>
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
            ru?"Опубликовано":"Жарыяланган":ru?"Черновик":"Черновик"}</span>
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
      {error&&<p className="ci-error" role="alert">{error}</p>}
    </div>
  </main>;
}
