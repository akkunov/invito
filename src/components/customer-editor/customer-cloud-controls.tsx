"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import {CloudUpload,ImagePlus,LogIn} from "lucide-react";
import {
  configuredSupabase,getSupabaseBrowserClient,
} from "@/features/auth/browser/supabase-session";
import {
  CustomerCloudError,createCustomerDraft,getCustomerDraft,saveCustomerDraft,
  uploadCustomerPhoto,type VerifiedCustomerAsset,
} from "@/features/invitations/customer-cloud";
import type {PersonalizationPatch} from "@/features/studio-v2/core/personalization.schema";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";
import type {Locale} from "@/i18n/locales";

type Props={
  locale:Locale;templateVersionId:string;patch:PersonalizationPatch;
  onLoad:(patch:PersonalizationPatch,assets:VerifiedCustomerAsset[],urls:Record<string,string>)=>void;
  onUploaded:(fieldId:string,asset:VerifiedCustomerAsset,url:string)=>void;
  imageFieldId:string|null;imageLimits:{minWidth:number;minHeight:number}|null;
};
export function CustomerCloudControls({
  locale,templateVersionId,patch,onLoad,onUploaded,imageFieldId,imageLimits,
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
  const ru=locale==="ru";
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
    setCloudId(id);
    setRevision(null);
  },[personalKey]);

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
          const existing=await getCustomerDraft(id);
          rev=existing.revision;
        }else{
          const created=await createCustomerDraft(templateVersionId);
          id=created.id;rev=created.revision;
          if(personalKey)window.localStorage.setItem(personalKey,id);
        }
        setCloudId(id);
      }else if(rev===null){
        rev=(await getCustomerDraft(id)).revision;
      }
      if(!id||rev===null)throw new Error("CLOUD_REVISION_UNAVAILABLE");
      const saved=await saveCustomerDraft(id,rev,patch);
      setRevision(saved.revision);
      setInfo(ru?"Сохранено в вашем аккаунте.":"Аккаунтуңузга сакталды.");
    }catch(e){
      setInfo(e instanceof CustomerCloudError&&e.status===409
        ?ru?"Конфликт версий: откройте облачную копию перед сохранением.":"Версиялар дал келбейт: булуттагы көчүрмөнү ачыңыз."
        :e instanceof CustomerCloudError&&e.status===401
        ?ru?"Войдите в аккаунт ещё раз.":"Аккаунтка кайра кириңиз."
        :ru?"Облачное сохранение не удалось. Локальные правки сохранены.":"Булутка сакталган жок. Жергиликтүү өзгөрүүлөр сакталды.");
    }finally{setLoading(false);}
  }

  async function load(){
    if(!userId||!personalKey||loading)return;
    setLoading(true);setInfo("");
    try{
      const id=cloudId||window.localStorage.getItem(personalKey);
      if(!id){setInfo(ru?"Облачного черновика пока нет.":"Булуттагы черновик жок.");return;}
      const remote=await getCustomerDraft(id);
      if(remote.templateVersionId!==templateVersionId)throw new Error("TEMPLATE_VERSION_MISMATCH");
      onLoad(remote.patch,remote.assets,remote.mediaUrls);
      setCloudId(id);setRevision(remote.revision);
      setInfo(ru?"Облачная версия загружена.":"Булуттагы версия жүктөлдү.");
    }catch{setInfo(ru?"Не удалось загрузить облачный черновик.":"Булуттагы черновик ачылган жок.");}
    finally{setLoading(false);}
  }

  async function photo(file:File){
    if(!userId||!imageFieldId||fileBusy)return;
    setFileBusy(true);setInfo("");
    try{
      if(imageLimits){
        const bitmap=await createImageBitmap(file);
        const valid=bitmap.width>=imageLimits.minWidth&&bitmap.height>=imageLimits.minHeight;
        bitmap.close();
        if(!valid)throw new Error("IMAGE_TOO_SMALL");
      }
      const result=await uploadCustomerPhoto(file);
      onUploaded(imageFieldId,result.asset,result.url);
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
      <div className="ce-cloud-actions">
        <button type="button" className="ce-primary" disabled={loading} onClick={()=>void save()}><CloudUpload size={16}/>{loading?"…":ru?"Сохранить в облако":"Булутка сактоо"}</button>
        <button type="button" className="ce-secondary" disabled={loading} onClick={()=>void load()}>{ru?"Открыть облачную копию":"Булуттагы көчүрмө"}</button>
      </div>
      {imageFieldId&&<label className="ce-upload-button">
        <ImagePlus size={17}/>{fileBusy?"…":ru?"Загрузить своё фото":"Өз сүрөтүңүздү жүктөө"}
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={fileBusy}
          onChange={e=>{const file=e.target.files?.[0];if(file)void photo(file);e.target.value="";}}/>
      </label>}
    </>}
    {info&&<p role="status" className="ce-cloud-info">{info}</p>}
  </section>;
}
