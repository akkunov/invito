"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import {CloudUpload,ImagePlus,LogIn,ExternalLink,Copy,Send} from "lucide-react";
import {
  configuredSupabase,getSupabaseBrowserClient,
} from "@/features/auth/browser/supabase-session";
import {
  CustomerCloudError,createCustomerDraft,getCustomerDraft,getCustomerPublication,publishCustomerInvitation,unpublishCustomerInvitation,listCustomerDrafts,saveCustomerDraft,
  uploadCustomerPhoto,type VerifiedCustomerAsset,type CustomerDraftListItem,
} from "@/features/invitations/customer-cloud";
import type {PersonalizationPatch} from "@/features/studio-v2/core/personalization.schema";
import type {Locale} from "@/i18n/locales";

type Props={
  locale:Locale;templateVersionId:string;preferredDraftId?:string;patch:PersonalizationPatch;
  publishMode?:boolean;canPublish?:boolean;
  onLoad:(patch:PersonalizationPatch,assets:VerifiedCustomerAsset[],urls:Record<string,string>)=>void;
  onUploaded:(fieldId:string,asset:VerifiedCustomerAsset,url:string)=>void;
  uploadTargets:Array<{id:string;label:string;kind:"image"|"gallery";minWidth:number;minHeight:number}>;
  preferredUploadTargetId?:string;
};
export function CustomerCloudControls({
  locale,templateVersionId,preferredDraftId,patch,onLoad,onUploaded,uploadTargets,preferredUploadTargetId,publishMode=false,canPublish=false,
}:Props){
  const cfg=useMemo(configuredSupabase,[]);
  const supabase=useMemo(()=>cfg?getSupabaseBrowserClient(cfg):null,[cfg]);
  const [userId,setUserId]=useState<string|null>(null);
  const [email,setEmail]=useState("");
  const [info,setInfo]=useState("");
  const [loading,setLoading]=useState(false);
  const [cloudId,setCloudId]=useState<string|null>(null);
  const [revision,setRevision]=useState<number|null>(null);
  const [fileBusy,setFileBusy]=useState(false);
  const [selectedTarget,setSelectedTarget]=useState("");
  const [publicSlug,setPublicSlug]=useState("");
  const [publishedUrl,setPublishedUrl]=useState("");
  const [activeRelease,setActiveRelease]=useState<number|null>(null);
  const [availableDrafts,setAvailableDrafts]=useState<CustomerDraftListItem[]>([]);
  const target=uploadTargets.find(f=>f.id===selectedTarget)??uploadTargets[0]??null;
  const ru=locale==="ru";
  useEffect(()=>{
    if(preferredUploadTargetId&&uploadTargets.some(item=>item.id===preferredUploadTargetId))setSelectedTarget(preferredUploadTargetId);
  },[preferredUploadTargetId,uploadTargets]);
  const personalKey=userId?"eventiq:cloud-draft:v1:"+userId+":"+templateVersionId:null;

  useEffect(()=>{
    if(!supabase)return;
    let active=true;
    void supabase.auth.getSession().then(({data})=>{
      if(active)setUserId(data.session?.user.id??null);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(active)setUserId(session?.user.id??null);
    });
    return()=>{active=false;subscription.unsubscribe();};
  },[supabase]);

  useEffect(()=>{
    if(!personalKey){setCloudId(null);setRevision(null);return;}
    let id:string|null=null;
    try{id=window.localStorage.getItem(personalKey);}catch{}
    setCloudId(preferredDraftId??id);
    try {
      const rev=window.localStorage.getItem(personalKey+":revision");
      setRevision(!preferredDraftId||id===preferredDraftId ? rev&&Number.isSafeInteger(Number(rev))&&Number(rev)>=1?Number(rev):null : null);
    }catch{setRevision(null);}
  },[personalKey,preferredDraftId]);

  useEffect(()=>{
    if(!userId){setAvailableDrafts([]);return;}
    let active=true;
    void listCustomerDrafts().then(items=>{
      if(!active)return;
      const matching=items.filter(item=>item.templateVersionId===templateVersionId);
      setAvailableDrafts(matching);
      if(!personalKey)return;
      const saved=window.localStorage.getItem(personalKey);
      if(!saved && matching[0]){
        // A new device discovers the existing account draft, but never overwrites
        // local changes until the user explicitly selects "Open cloud copy".
        setCloudId(matching[0].id);
        setRevision(null);
      }
    }).catch(()=>{});
    return()=>{active=false;};
  },[userId,templateVersionId,personalKey]);

  useEffect(()=>{
    if(!userId||!cloudId||!publishMode)return;
    let active=true;
    void getCustomerPublication(cloudId).then(value=>{
      if(!active)return;
      if(value?.status==="ACTIVE"){
        setActiveRelease(value.latestRelease);
        setPublishedUrl(window.location.origin+"/"+locale+"/c/"+value.slug);
        setPublicSlug(value.slug);
      }else{
        setActiveRelease(null);
        setPublishedUrl("");
        if(value?.slug)setPublicSlug(value.slug);
      }
    }).catch(()=>{});
    return()=>{active=false;};
  },[cloudId,userId,publishMode,locale]);

  async function hidePublication(){
    if(!cloudId||activeRelease===null||loading)return;
    if(!window.confirm(ru?"Закрыть доступ гостям? Черновик останется в аккаунте.":"Конокторго кирүүнү жабасызбы? Черновик сакталат."))return;
    setLoading(true);setInfo("");
    try{
      await unpublishCustomerInvitation(cloudId,activeRelease);
      setActiveRelease(null);setPublishedUrl("");
      setInfo(ru?"Публикация скрыта. Черновик сохранён.":"Чакыруу жабылды. Черновик сакталды.");
    }catch{setInfo(ru?"Не удалось снять публикацию. Обновите страницу и повторите.":"Жарыялоону жабуу мүмкүн болбоду.");}
    finally{setLoading(false);}
  }

  async function login(e:FormEvent){
    e.preventDefault();
    if(!supabase||!email.trim())return;
    setLoading(true);setInfo("");
    try{
      const {error}=await supabase.auth.signInWithOtp({
        email:email.trim(),
        options:{emailRedirectTo:window.location.href},
      });
      if(error)throw error;
      setInfo(ru?"Проверьте почту: отправлена ссылка для входа.":"Почтаңызды текшериңиз: кирүү шилтемеси жөнөтүлдү.");
    }catch{setInfo(ru?"Не удалось отправить ссылку.":"Шилтемени жөнөтүү мүмкүн болгон жок.");}
    finally{setLoading(false);}
  }

  async function save(){
    if(!userId||loading)return;
    setLoading(true);setInfo("");
    try{
      let id=cloudId,rev=revision;
      if(!id){
        const saved=personalKey?window.localStorage.getItem(personalKey):null;
        if(saved){
          id=saved;
          throw new Error("CLOUD_REVISION_NOT_LOADED");
        }else{
          const created=await createCustomerDraft(templateVersionId);
          id=created.id;rev=created.revision;
          if(personalKey)window.localStorage.setItem(personalKey,id);
        }
        setCloudId(id);
      }else if(rev===null){
        throw new Error("CLOUD_REVISION_NOT_LOADED");
      }
      if(!id||rev===null)throw new Error("CLOUD_REVISION_UNAVAILABLE");
      const saved=await saveCustomerDraft(id,rev,patch);
      setRevision(saved.revision);
      if(personalKey)window.localStorage.setItem(personalKey+":revision",String(saved.revision));
      setInfo(ru?"Сохранено в вашем аккаунте.":"Аккаунтуңузга сакталды.");
    }catch(e){
      setInfo(e instanceof Error&&e.message==="CLOUD_REVISION_NOT_LOADED"
        ?ru?"Сначала откройте облачную копию, чтобы избежать потери изменений.":"Өзгөрүүлөр жоголбошу үчүн адегенде булуттагы көчүрмөнү ачыңыз."
        :e instanceof CustomerCloudError&&e.status===409
        ?ru?"Конфликт версий: откройте облачную копию перед сохранением.":"Версиялар дал келбейт: булуттагы көчүрмөнү ачыңыз."
        :e instanceof CustomerCloudError&&e.status===401
        ?ru?"Войдите в аккаунт ещё раз.":"Аккаунтка кайра кириңиз."
        :ru?"Облачное сохранение не удалось. Локальные правки сохранены.":"Булутка сакталган жок. Жергиликтүү өзгөрүүлөр сакталды.");
    }finally{setLoading(false);}
  }

  async function load(){
    if(!userId||!personalKey||loading)return;
    if(Object.keys(patch.values).length&& !window.confirm(ru?
      "Заменить локальные изменения облачной версией? Несохранённые правки на устройстве будут потеряны.":
      "Жергиликтүү өзгөртүүлөр булуттагы версия менен алмаштырылсынбы? Сакталбаган өзгөртүүлөр жоголот."))return;
    setLoading(true);setInfo("");
    try{
      const id=cloudId||window.localStorage.getItem(personalKey);
      if(!id){setInfo(ru?"Облачного черновика пока нет.":"Булуттагы черновик жок.");return;}
      const remote=await getCustomerDraft(id);
      if(remote.templateVersionId!==templateVersionId)throw new Error("TEMPLATE_VERSION_MISMATCH");
      onLoad(remote.patch,remote.assets,remote.mediaUrls);
      setCloudId(id);setRevision(remote.revision);
      window.localStorage.setItem(personalKey,id);
      window.localStorage.setItem(personalKey+":revision",String(remote.revision));
      setInfo(ru?"Облачная версия загружена.":"Булуттагы версия жүктөлдү.");
    }catch{setInfo(ru?"Не удалось загрузить облачный черновик.":"Булуттагы черновик ачылган жок.");}
    finally{setLoading(false);}
  }

  async function publish(){
    if(!userId||loading||!canPublish)return;
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publicSlug)||publicSlug.length<3||publicSlug.length>80){
      setInfo(ru?"Адрес должен содержать 3–80 строчных латинских букв, цифр или дефисов.":"Дарек 3–80 латын тамгасы, сан же дефис болсун.");
      return;
    }
    setLoading(true);setInfo("");
    try{
      let id=cloudId,rev=revision;
      if(!id){
        const previous=personalKey?window.localStorage.getItem(personalKey):null;
        if(previous){
          throw new Error("CLOUD_REVISION_NOT_LOADED");
        }
        const created=await createCustomerDraft(templateVersionId);
        id=created.id;rev=created.revision;
        setCloudId(id);
        if(personalKey)window.localStorage.setItem(personalKey,id);
      }
      if(!id||rev===null)throw new Error("CLOUD_REVISION_NOT_LOADED");
      // Publish only the same patch that was atomically saved to the owner's draft.
      const saved=await saveCustomerDraft(id,rev,patch);
      setRevision(saved.revision);
      if(personalKey)window.localStorage.setItem(personalKey+":revision",String(saved.revision));
      const current=await getCustomerPublication(id);
      const release=await publishCustomerInvitation(id,{
        slug:current?.slug??publicSlug,
        expectedRevision:saved.revision,
        expectedRelease:current?.latestRelease??0,
      });
      const url=window.location.origin+"/"+locale+"/c/"+release.slug;
      setPublicSlug(release.slug);
      setPublishedUrl(url);
      setActiveRelease(release.latestRelease);
      setInfo(ru?"Приглашение опубликовано. Ссылка готова.":"Чакыруу жарыяланды. Шилтеме даяр.");
    }catch(error){
      setInfo(error instanceof CustomerCloudError&&error.status===409
        ?ru?"Этот адрес занят или изменена версия черновика. Выберите другой адрес либо загрузите облачную копию.":"Дарек колдонулууда же черновик өзгөргөн. Башка дарек тандаңыз."
        :error instanceof CustomerCloudError&&error.status===422
        ?ru?"Проверьте обязательные поля и фотографии.":"Милдеттүү талааларды жана сүрөттөрдү текшериңиз."
        :error instanceof Error&&error.message==="CLOUD_REVISION_NOT_LOADED"
        ?ru?"Сначала загрузите облачную копию черновика.":"Алгач булуттагы черновикти ачыңыз."
        :ru?"Не удалось опубликовать. Проверьте подключение и аккаунт.":"Жарыялоо мүмкүн болгон жок. Байланышты жана аккаунтту текшериңиз.");
    }finally{setLoading(false);}
  }

  async function share(){
    if(!publishedUrl)return;
    try{
      if(navigator.share)await navigator.share({title:"Eventiq",url:publishedUrl});
      else {await navigator.clipboard.writeText(publishedUrl);setInfo(ru?"Ссылка скопирована.":"Шилтеме көчүрүлдү.");}
    }catch{/* Cancelled share is not a publishing failure. */}
  }

  useEffect(()=>{
    if(!publishMode||publicSlug)return;
    setPublicSlug("invitation-"+crypto.randomUUID().slice(0,8));
  },[publishMode,publicSlug]);

  async function photo(file:File){
    if(!userId||!target||fileBusy)return;
    setFileBusy(true);setInfo("");
    try{
      if(target){
        const bitmap=await createImageBitmap(file);
        const valid=bitmap.width>=target.minWidth&&bitmap.height>=target.minHeight;
        bitmap.close();
        if(!valid)throw new Error("IMAGE_TOO_SMALL");
      }
      const result=await uploadCustomerPhoto(file);
      onUploaded(target.id,result.asset,result.url);
      setInfo(ru?"Фото загружено. Сохраните приглашение в облаке.":"Сүрөт жүктөлдү. Чакырууну булутка сактаңыз.");
    }catch(e){
      setInfo(e instanceof Error&&e.message==="IMAGE_TOO_SMALL"
        ?ru?"Недостаточное разрешение фотографии.":"Сүрөттүн өлчөмү жетишсиз."
        :ru?"Не удалось загрузить фото. Проверьте формат и размер (до 20 МБ).":"Сүрөт жүктөлгөн жок. Форматын жана өлчөмүн текшериңиз (20 МБ чейин).");
    }finally{setFileBusy(false);}
  }

  return <section className="ce-cloud" aria-label={ru?"Облачный черновик":"Булуттагы черновик"}>
    <h3><CloudUpload size={17}/>{ru?"Ваши фотографии и сохранение":"Сүрөттөр жана сактоо"}</h3>
    {!cfg?<p>{ru?"Для облачного сохранения настройте Supabase и API в .env.local.":"Булут үчүн Supabase жана API жөндөөлөрү керек."}</p>:
    !userId?<form onSubmit={e=>void login(e)} className="ce-cloud-auth">
      <p>{ru?"Войдите по email, чтобы загружать свои фото и хранить приглашение в аккаунте.":"Сүрөт жүктөө жана чакырууну сактоо үчүн email аркылуу кириңиз."}</p>
      <label><span>Email</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <button className="ce-primary" type="submit" disabled={loading}><LogIn size={16}/>{ru?"Отправить ссылку":"Шилтеме жөнөтүү"}</button>
    </form>:
    <>
      {availableDrafts.length>0&&<label className="ce-language">
        <span>{ru?"Ваши черновики в аккаунте":"Аккаунттагы черновиктер"}</span>
        <select value={cloudId??""} onChange={e=>{setCloudId(e.target.value);setRevision(null);}}>
          {!cloudId&&<option value="">{ru?"Выберите черновик":"Черновикти тандаңыз"}</option>}
          {availableDrafts.map(draft=><option value={draft.id} key={draft.id}>
            {draft.templateVersion.template.name} · {new Date(draft.updatedAt).toLocaleDateString(locale==="ru"?"ru-RU":"ky-KG")}
          </option>)}
        </select>
      </label>}
      {publishMode&&<div className="ce-publish">
        <label className="ce-language"><span>{ru?"Адрес приглашения":"Чакыруу дареги"}</span>
          <input aria-label={ru?"Адрес приглашения":"Чакыруу дареги"}
            value={publicSlug} maxLength={80} onChange={e=>setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
            autoComplete="off" spellCheck={false}/>
        </label>
        <button type="button" className="ce-primary" disabled={loading||!canPublish}
          onClick={()=>void publish()}><Send size={16}/>{loading?"…":ru?"Опубликовать приглашение":"Чакырууну жарыялоо"}</button>
        {!canPublish&&<p>{ru?"Заполните обязательные поля перед публикацией.":"Жарыялоодон мурда милдеттүү талааларды толтуруңуз."}</p>}
        {publishedUrl&&<div className="ce-published-link">
          <a href={publishedUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>{publishedUrl}</a>
          <div className="ce-cloud-actions">
            <button className="ce-secondary" type="button" onClick={()=>void navigator.clipboard.writeText(publishedUrl).then(()=>setInfo(ru?"Ссылка скопирована.":"Шилтеме көчүрүлдү."))}><Copy size={15}/>{ru?"Копировать":"Көчүрүү"}</button>
            <button className="ce-secondary" type="button" onClick={()=>void share()}><Send size={15}/>{ru?"Поделиться":"Бөлүшүү"}</button>
          </div>
        </div>}
        {activeRelease!==null&&<button className="ce-secondary" type="button" disabled={loading} onClick={()=>void hidePublication()}>{ru?"Закрыть доступ гостям":"Конокторго кирүүнү жабуу"}</button>}
      </div>}
      {!publishMode&&target&&<div className="ce-cloud-group">
        <div className="ce-cloud-group-head">
          <strong><ImagePlus size={16}/>{ru?"Ваши фотографии":"Сиздин сүрөттөрүңүз"}</strong>
          <small>{ru?"JPEG, PNG, WebP · до 20 МБ":"JPEG, PNG, WebP · 20 МБ чейин"}</small>
        </div>
        {uploadTargets.length>1&&<label className="ce-language">
          <span>{ru?"Что заменить на приглашении":"Чакыруу кайсы сүрөтүн алмаштыруу"}</span>
          <select value={target.id} onChange={e=>setSelectedTarget(e.target.value)}>
            {uploadTargets.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>}
        <label className="ce-upload-button">
          <ImagePlus size={17}/>{fileBusy?"…":ru?"Выбрать фотографию":"Сүрөт тандоо"}
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={fileBusy}
            onChange={e=>{const file=e.target.files?.[0];if(file)void photo(file);e.target.value="";}}/>
        </label>
      </div>}
      <div className="ce-cloud-group">
        <div className="ce-cloud-group-head">
          <strong><CloudUpload size={16}/>{ru?"Сохранение в аккаунте":"Аккаунтта сактоо"}</strong>
          <small>{ru?"Для доступа с других устройств":"Башка түзмөктөрдөн ачуу үчүн"}</small>
        </div>
        <div className="ce-cloud-actions">
          <button type="button" className="ce-primary" disabled={loading} onClick={()=>void save()}><CloudUpload size={16}/>{loading?"…":ru?"Сохранить":"Сактоо"}</button>
          <button type="button" className="ce-secondary" disabled={loading} onClick={()=>void load()}>{ru?"Загрузить сохранённое":"Сакталганын жүктөө"}</button>
        </div>
      </div>
    </>}
    {info&&<p role="status" className="ce-cloud-info">{info}</p>}
  </section>;
}
