"use client";

import {useEffect,useRef,useState} from "react";
import {CloudUpload,ImagePlus,ExternalLink,Copy,Send} from "lucide-react";
import type {useCustomerSession} from "@/features/auth/browser/use-customer-session";
import {cancelCustomerRequestWith} from "@/features/auth/browser/supabase-session";
import {CustomerSignIn} from "./customer-sign-in";
import {
  CustomerCloudError,createCustomerDraft,getCustomerDraft,getCustomerPublication,publishCustomerInvitation,unpublishCustomerInvitation,listCustomerDrafts,saveCustomerDraft,
  uploadCustomerPhoto,type VerifiedCustomerAsset,type CustomerDraftListItem,
} from "@/features/invitations/customer-cloud";
import type {PersonalizationPatch} from "@/features/studio-v2/core/personalization.schema";
import type {Locale} from "@/i18n/locales";
import {prepareCustomerPhoto} from "@/features/invitations/prepare-customer-photo";

type UploadResult={asset:VerifiedCustomerAsset;url:string};

type Props={
  session:ReturnType<typeof useCustomerSession>;
  locale:Locale;templateVersionId:string;preferredDraftId?:string;patch:PersonalizationPatch;
  publishMode?:boolean;canPublish?:boolean;
  onBeforeSignIn:()=>void;
  onLoad:(patch:PersonalizationPatch,assets:VerifiedCustomerAsset[],urls:Record<string,string>)=>void;
  onUploaded:(fieldId:string,results:(UploadResult|null)[],mode:"replace"|"append")=>void;
  uploadTargets:Array<{id:string;label:string;kind:"image"|"gallery";minWidth:number;minHeight:number;maxPhotos?:number;currentCount?:number}>;
  preferredUploadTargetId?:string;
};
export function CustomerCloudControls({
  locale,templateVersionId,preferredDraftId,patch,onLoad,onUploaded,uploadTargets,preferredUploadTargetId,
  publishMode=false,canPublish=false,onBeforeSignIn,session,
}:Props){
  const {scope}=session;
  const userId=scope?.subject??null;
  const [info,setInfo]=useState("");
  const [loading,setLoading]=useState(false);
  const [cloudId,setCloudId]=useState<string|null>(null);
  const [revision,setRevision]=useState<number|null>(null);
  const [fileBusy,setFileBusy]=useState(false);
  const [uploadPhase,setUploadPhase]=useState("");
  const [uploadProgress,setUploadProgress]=useState({current:0,total:0});
  const uploadLock=useRef(false);
  const latestUpload=useRef(onUploaded);
  useEffect(()=>{latestUpload.current=onUploaded;},[onUploaded]);
  const [selectedTarget,setSelectedTarget]=useState("");
  const [publicSlug,setPublicSlug]=useState("");
  const [publishedUrl,setPublishedUrl]=useState("");
  const [activeRelease,setActiveRelease]=useState<number|null>(null);
  const [availableDrafts,setAvailableDrafts]=useState<CustomerDraftListItem[]>([]);
  const target=uploadTargets.find(f=>f.id===selectedTarget)??uploadTargets[0]??null;
  const galleryFull=target?.kind==="gallery"&&typeof target.maxPhotos==="number"&&(target.currentCount??0)>=target.maxPhotos;
  const ru=locale==="ru";
  useEffect(()=>{
    if(preferredUploadTargetId&&uploadTargets.some(item=>item.id===preferredUploadTargetId))setSelectedTarget(preferredUploadTargetId);
  },[preferredUploadTargetId,uploadTargets]);
  const personalKey=userId?"eventiq:cloud-draft:v1:"+userId+":"+templateVersionId:null;

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
    if(!scope){setAvailableDrafts([]);return;}
    const controller=new AbortController();
    void listCustomerDrafts(cancelCustomerRequestWith(scope,controller.signal)).then(items=>{
      if(controller.signal.aborted||scope.signal.aborted)return;
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
    return()=>controller.abort();
  },[scope,templateVersionId,personalKey]);

  useEffect(()=>{
    if(!scope||!cloudId||!publishMode)return;
    const controller=new AbortController();
    void getCustomerPublication(cancelCustomerRequestWith(scope,controller.signal),cloudId).then(value=>{
      if(controller.signal.aborted||scope.signal.aborted)return;
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
    return()=>controller.abort();
  },[cloudId,scope,publishMode,locale]);

  async function hidePublication(){
    if(!scope||!cloudId||activeRelease===null||loading)return;
    if(!window.confirm(ru?"Закрыть доступ гостям? Черновик останется в аккаунте.":"Конокторго кирүүнү жабасызбы? Черновик сакталат."))return;
    setLoading(true);setInfo("");
    try{
      await unpublishCustomerInvitation(scope,cloudId,activeRelease);
      setActiveRelease(null);setPublishedUrl("");
      setInfo(ru?"Публикация скрыта. Черновик сохранён.":"Чакыруу жабылды. Черновик сакталды.");
    }catch{setInfo(ru?"Не удалось снять публикацию. Обновите страницу и повторите.":"Жарыялоону жабуу мүмкүн болбоду.");}
    finally{setLoading(false);}
  }

  async function save(){
    if(!scope||loading)return;
    setLoading(true);setInfo("");
    try{
      let id=cloudId,rev=revision;
      if(!id){
        const saved=personalKey?window.localStorage.getItem(personalKey):null;
        if(saved){
          id=saved;
          throw new Error("CLOUD_REVISION_NOT_LOADED");
        }else{
          const created=await createCustomerDraft(scope,templateVersionId);
          id=created.id;rev=created.revision;
          if(personalKey)window.localStorage.setItem(personalKey,id);
        }
        setCloudId(id);
      }else if(rev===null){
        throw new Error("CLOUD_REVISION_NOT_LOADED");
      }
      if(!id||rev===null)throw new Error("CLOUD_REVISION_UNAVAILABLE");
      const saved=await saveCustomerDraft(scope,id,rev,patch);
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
    if(!scope||!personalKey||loading)return;
    if(Object.keys(patch.values).length&& !window.confirm(ru?
      "Заменить локальные изменения облачной версией? Несохранённые правки на устройстве будут потеряны.":
      "Жергиликтүү өзгөртүүлөр булуттагы версия менен алмаштырылсынбы? Сакталбаган өзгөртүүлөр жоголот."))return;
    setLoading(true);setInfo("");
    try{
      const id=cloudId||window.localStorage.getItem(personalKey);
      if(!id){setInfo(ru?"Облачного черновика пока нет.":"Булуттагы черновик жок.");return;}
      const remote=await getCustomerDraft(scope,id);
      if(remote.templateVersionId!==templateVersionId)throw new Error("TEMPLATE_VERSION_MISMATCH");
      scope.signal.throwIfAborted();
      onLoad(remote.patch,remote.assets,remote.mediaUrls);
      setCloudId(id);setRevision(remote.revision);
      window.localStorage.setItem(personalKey,id);
      window.localStorage.setItem(personalKey+":revision",String(remote.revision));
      setInfo(ru?"Облачная версия загружена.":"Булуттагы версия жүктөлдү.");
    }catch{setInfo(ru?"Не удалось загрузить облачный черновик.":"Булуттагы черновик ачылган жок.");}
    finally{setLoading(false);}
  }

  async function publish(){
    if(!scope||loading||!canPublish)return;
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
        const created=await createCustomerDraft(scope,templateVersionId);
        id=created.id;rev=created.revision;
        setCloudId(id);
        if(personalKey)window.localStorage.setItem(personalKey,id);
      }
      if(!id||rev===null)throw new Error("CLOUD_REVISION_NOT_LOADED");
      // Publish only the same patch that was atomically saved to the owner's draft.
      const saved=await saveCustomerDraft(scope,id,rev,patch);
      setRevision(saved.revision);
      if(personalKey)window.localStorage.setItem(personalKey+":revision",String(saved.revision));
      const current=await getCustomerPublication(scope,id);
      const release=await publishCustomerInvitation(scope,id,{
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

  async function photos(files:File[],mode:"replace"|"append"){
    if(!scope||!target||uploadLock.current||loading||!files.length)return;
    if(!globalThis.crypto?.subtle){setInfo(ru?"Для загрузки фото откройте сайт через HTTPS или localhost.":"Сүрөт жүктөө үчүн сайтты HTTPS же localhost аркылуу ачыңыз.");return;}
    const selected=target;
    const limit=selected.kind==="gallery"?(selected.maxPhotos??4):1;
    const capacity=mode==="append"?Math.max(0,limit-(selected.currentCount??0)):limit;
    if(files.length>capacity){
      setInfo(ru?"Выберите не больше "+capacity+" фото за один раз.":"Бир жолуда "+capacity+" сүрөттөн ашык тандабаңыз.");return;
    }
    uploadLock.current=true;setFileBusy(true);setInfo("");
    const results:(UploadResult|null)[]=[];
    const failures:string[]=[];
    try{
      for(const [index,file] of files.entries()){
        scope.signal.throwIfAborted();
        setUploadProgress({current:index+1,total:files.length});
        setUploadPhase("checking");
        try{
          const prepared=await prepareCustomerPhoto(file,{minWidth:selected.minWidth,minHeight:selected.minHeight});
          results.push(await uploadCustomerPhoto(scope,prepared,setUploadPhase));
        }catch(error){
          const reason=error instanceof Error?error.message:"";
          const hint=reason==="IMAGE_INPUT_TOO_LARGE"?(ru?"файл пустой или больше 60 МБ":"файл бош же 60 МБдан чоң"):
            reason==="IMAGE_UNSUPPORTED"||reason==="IMAGE_DECODE_FAILED"?(ru?"не удалось открыть фото":"сүрөт ачылган жок"):
            (ru?"ошибка обработки или загрузки":"иштетүү же жүктөө катасы");
          results.push(null);failures.push(file.name+" ("+hint+")");
        }
      }
      scope.signal.throwIfAborted();
      const success=results.filter(Boolean).length;
      if(success)latestUpload.current(selected.id,results,mode);
      setInfo((ru?"Загружено ":"Жүктөлдү ")+success+" / "+files.length+
        (failures.length?(ru?". Не удалось загрузить: ":". Жүктөлгөн жок: ")+failures.join(", "):"")+
        (success?(ru?". Сохраните приглашение в аккаунте.":". Чакырууну аккаунтта сактаңыз."):""));
    }catch{setInfo(ru?"Не удалось применить фотографии. Предыдущие фото сохранены.":"Сүрөттөрдү колдонуу мүмкүн болгон жок. Мурунку сүрөттөр сакталды.");}
    finally{uploadLock.current=false;setFileBusy(false);setUploadPhase("");setUploadProgress({current:0,total:0});}
  }

  return <section className="ce-cloud" aria-label={ru?"Облачный черновик":"Булуттагы черновик"}>
    <h3><CloudUpload size={17}/>{ru?"Ваши фотографии и сохранение":"Сүрөттөр жана сактоо"}</h3>
    {session.status==="loading"?<p role="status">{ru?"Проверяем вход…":"Кирүү текшерилүүдө…"}</p>:
    !session.config||!session.client?<p>{ru?"Для облачного сохранения настройте Supabase и API в .env.local.":"Булут үчүн Supabase жана API жөндөөлөрү керек."}</p>:
    !userId?<div>
      <p>{ru?"Войдите, чтобы загружать свои фото и хранить приглашение в аккаунте.":"Сүрөт жүктөө жана чакырууну аккаунтта сактоо үчүн кириңиз."}</p>
      <CustomerSignIn locale={locale} client={session.client} beforeRedirect={onBeforeSignIn} className="ce-cloud-auth" actionClassName="ce-primary"/>
    </div>:
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
        <button type="button" className="ce-primary" disabled={loading||fileBusy||!canPublish}
          onClick={()=>void publish()}><Send size={16}/>{loading?"…":ru?"Опубликовать приглашение":"Чакырууну жарыялоо"}</button>
        {!canPublish&&<p>{ru?"Заполните обязательные поля перед публикацией.":"Жарыялоодон мурда милдеттүү талааларды толтуруңуз."}</p>}
        {publishedUrl&&<div className="ce-published-link">
          <a href={publishedUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>{publishedUrl}</a>
          <div className="ce-cloud-actions">
            <button className="ce-secondary" type="button" onClick={()=>void navigator.clipboard.writeText(publishedUrl).then(()=>setInfo(ru?"Ссылка скопирована.":"Шилтеме көчүрүлдү."))}><Copy size={15}/>{ru?"Копировать":"Көчүрүү"}</button>
            <button className="ce-secondary" type="button" onClick={()=>void share()}><Send size={15}/>{ru?"Поделиться":"Бөлүшүү"}</button>
          </div>
        </div>}
        {activeRelease!==null&&<button className="ce-secondary" type="button" disabled={loading||fileBusy} onClick={()=>void hidePublication()}>{ru?"Закрыть доступ гостям":"Конокторго кирүүнү жабуу"}</button>}
      </div>}
      {!publishMode&&target&&<div className="ce-cloud-group">
        <div className="ce-cloud-group-head">
          <strong><ImagePlus size={16}/>{ru?"Ваши фотографии":"Сиздин сүрөттөрүңүз"}</strong>
          <small>{ru?"Подберём размер автоматически":"Өлчөм автоматтык тандалат"}</small>
        </div>
        {uploadTargets.length>1&&<label className="ce-language">
          <span>{ru?"Что заменить на приглашении":"Чакыруу кайсы сүрөтүн алмаштыруу"}</span>
          <select disabled={fileBusy||loading} value={target.id} onChange={e=>setSelectedTarget(e.target.value)}>
            {uploadTargets.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>}
        {target.kind==="gallery"&&typeof target.maxPhotos==="number"&&
          <p className="ce-upload-counter">{ru?"Фотографий":"Сүрөттөр"}: {target.currentCount??0} / {target.maxPhotos}</p>}
        <label className="ce-upload-button">
          <ImagePlus size={17}/>{fileBusy?
            (uploadPhase==="checking"?(ru?"Подготавливаем фото":"Сүрөт даярдалууда"):
            uploadPhase==="signing"?(ru?"Подготовка загрузки":"Жүктөөгө даярдалууда"):
            uploadPhase==="uploading"?(ru?"Загружаем фото":"Сүрөт жүктөлүүдө"):
            uploadPhase==="verifying"?(ru?"Проверяем загрузку":"Жүктөө текшерилүүдө"):
            (ru?"Загрузка":"Жүктөө")):
            target.kind==="gallery"?(ru?"Заменить фотографии галереи":"Галереядагы сүрөттөрдү алмаштыруу"):
            (ru?"Выбрать фотографию":"Сүрөт тандоо")}
          {fileBusy&&<span>{uploadProgress.current} / {uploadProgress.total}</span>}
          <input type="file" accept="image/*,.heic,.heif" multiple={target.kind==="gallery"} disabled={fileBusy||loading}
            onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value="";void photos(files,"replace");}}/>
        </label>
        {target.kind==="gallery"&&!galleryFull&&<label className="ce-upload-button">
          <ImagePlus size={17}/>{ru?"Добавить фотографии":"Сүрөттөрдү кошуу"}
          <input type="file" accept="image/*,.heic,.heif" multiple disabled={fileBusy||loading}
            onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value="";void photos(files,"append");}}/>
        </label>}
        <p className="ce-photo-upload-hint">{target.kind==="gallery"?
          (ru?"Выберите до "+(target.maxPhotos??4)+" снимков сразу. При замене прежние фотографии будут заменены.":"Бир жолуда "+(target.maxPhotos??4)+" сүрөткө чейин тандаңыз. Мурунку сүрөттөр алмаштырылат."):
          (ru?"Выберите обычное фото с телефона — размер подберётся автоматически.":"Телефондогу сүрөттү тандаңыз — өлчөм автоматтык тандалат.")}</p>
      </div>}
      <div className="ce-cloud-group">
        <div className="ce-cloud-group-head">
          <strong><CloudUpload size={16}/>{ru?"Сохранение в аккаунте":"Аккаунтта сактоо"}</strong>
          <small>{ru?"Для доступа с других устройств":"Башка түзмөктөрдөн ачуу үчүн"}</small>
        </div>
        <div className="ce-cloud-actions">
          <button type="button" className="ce-primary" disabled={loading||fileBusy} onClick={()=>void save()}><CloudUpload size={16}/>{loading?"…":ru?"Сохранить":"Сактоо"}</button>
          <button type="button" className="ce-secondary" disabled={loading||fileBusy} onClick={()=>void load()}>{ru?"Загрузить сохранённое":"Сакталганын жүктөө"}</button>
        </div>
      </div>
    </>}
    {info&&<p role="status" className="ce-cloud-info">{info}</p>}
  </section>;
}
