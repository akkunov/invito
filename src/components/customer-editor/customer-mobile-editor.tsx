"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowRight,Check,Eye,Pencil,RotateCcw,Save} from "lucide-react";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";
import {
  finalizePersonalization,personalizationIssues,personalizeDocument,readPersonalizedValue,
} from "@/features/studio-v2/core/personalization";
import {
  personalizationPatchSchema,type EditableField,type PersonalizationContract,
  type PersonalizationPatch,type PersonalizedValue,
} from "@/features/studio-v2/core/personalization.schema";
import {StudioV2ProjectRenderer} from "@/components/studio-v2/studio-v2-project-renderer";
import {SimpleField} from "@/components/studio-v2/studio-v2-simple-fields";
import type {Locale} from "@/i18n/locales";
import {CustomerCloudControls} from "./customer-cloud-controls";
import {customerApi,type VerifiedCustomerAsset} from "@/features/invitations/customer-cloud";
import "./customer-mobile-editor.css";

type Step="main"|"event"|"appearance"|"publish";
const steps:readonly Step[]=["main","event","appearance","publish"];
const sectionToStep:Record<EditableField["section"],Step>={
  main:"main",date:"event",location:"event",schedule:"event",
  photos:"appearance",music:"appearance",appearance:"appearance",rsvp:"event",
};
const dictionary={
  ru:{
    main:"Основное",event:"Дата и место",appearance:"Оформление",publish:"Проверка",
    preview:"Предпросмотр",edit:"Изменить",back:"Назад",next:"Продолжить",
    title:"Ваше приглашение",welcome:"Заполните данные — изменения сразу появятся в приглашении.",
    saveLocal:"Сохранено на этом устройстве",notSaved:"Черновик ещё не сохранён",restore:"Черновик восстановлен",
    publishTitle:"Проверьте приглашение",publishInfo:"Проверьте имена, фотографии и дату. Для публикации войдите в аккаунт и выберите адрес приглашения.",
    ready:"Все обязательные поля заполнены.",required:"Нужно исправить поля:",reset:"Сбросить",
    resetConfirm:"Удалить локальные изменения и вернуться к исходному шаблону?",
    language:"Язык приглашения",noFields:"На этом шаге нет полей для выбранного шаблона.",
    template:"Шаблон",step:"Шаг",stepOf:"из",review:"Проверить заполнение",saved:"Черновик сохранён",
    storageError:"Не удалось сохранить черновик на устройстве. Не закрывайте вкладку.",
    invalidDraft:"Сохранённый черновик повреждён и не применён.",
    unsupported:"Для редактирования этого шаблона пока не назначены поля.",
    original:"Дизайн защищён. Можно изменить только разрешённые автором данные.",
    noPublish:"После публикации вы получите ссылку, которой можно поделиться с гостями.",
    filled:"Готово",of:"из",sections:"Секции",photos:"Фотографии",publishAction:"Опубликовать",editorTip:"Изменения сразу появятся в предпросмотре.",
  },
  ky:{
    main:"Негизги маалымат",event:"Күнү жана жери",appearance:"Жасалгалоо",publish:"Текшерүү",
    preview:"Алдын ала көрүү",edit:"Өзгөртүү",back:"Артка",next:"Улантуу",
    title:"Сиздин чакырууңуз",welcome:"Маалыматты толтуруңуз — өзгөрүүлөр чакырууда дароо көрүнөт.",
    saveLocal:"Бул түзмөктө сакталды",notSaved:"Азырынча сакталган жок",restore:"Черновик калыбына келди",
    publishTitle:"Чакырууну текшериңиз",publishInfo:"Ысымдарды, сүрөттөрдү жана датаны текшериңиз. Жарыялоо үчүн аккаунтка кирип, даректи тандаңыз.",
    ready:"Милдеттүү талаалар толтурулду.",required:"Төмөнкүлөрдү оңдоңуз:",reset:"Баштапкы абал",
    resetConfirm:"Жергиликтүү өзгөрүүлөрдү өчүрүп, баштапкы шаблонго кайтуубу?",
    language:"Чакыруунун тили",noFields:"Бул этапта тандалган шаблондун талаалары жок.",
    template:"Шаблон",step:"Кадам",stepOf:" ичинен",review:"Толтурууну текшерүү",saved:"Черновик сакталды",
    storageError:"Черновикти сактоо мүмкүн болбоду. Баракты жаппаңыз.",
    invalidDraft:"Сакталган черновик бузулган, колдонулган жок.",
    unsupported:"Бул шаблондун өзгөртүү талаалары азырынча көрсөтүлө элек.",
    original:"Дизайн корголгон. Автор уруксат берген маалымат гана өзгөрөт.",
    noPublish:"Жарыялагандан кийин конокторго жибере турган шилтеме аласыз.",
    filled:"Даяр",of:"ичинен",sections:"Бөлүмдөр",photos:"Сүрөттөр",publishAction:"Жарыялоо",editorTip:"Өзгөртүүлөр алдын ала көрүүдө дароо көрсөтүлөт.",
  },
} as const;

type Props={
  locale:Locale;slug:string;name:string;versionId:string;preferredDraftId?:string;
  source:ProjectDocumentV2;contract:PersonalizationContract;
  mediaUrls:Record<string,string>;
};
const initialPatch=(source:ProjectDocumentV2,contract:PersonalizationContract):PersonalizationPatch=>({
  values:{},...(!contract.locales.includes(source.locale)?{locale:contract.locales[0]}:{})
});
const draftStorageKey=(id:string)=>"eventiq:customer-draft:v1:"+id;

export function CustomerMobileEditor({locale,slug,name,versionId,preferredDraftId,source,contract,mediaUrls}:Props){
  const t=dictionary[locale];
  const [step,setStep]=useState<Step>("main");
  const [mode,setMode]=useState<"edit"|"preview">("edit");
  const [patch,setPatch]=useState<PersonalizationPatch>(()=>initialPatch(source,contract));
  const [hydrated,setHydrated]=useState(false);
  const [warning,setWarning]=useState("");
  const [status,setStatus]=useState("");
  const [review,setReview]=useState(false);
  const [previewRun,setPreviewRun]=useState(0);
  const [customerAssets,setCustomerAssets]=useState<VerifiedCustomerAsset[]>([]);
  const [customerUrls,setCustomerUrls]=useState<Record<string,string>>({});
  const [templateUrls,setTemplateUrls]=useState(mediaUrls);
  const cacheKey=draftStorageKey(versionId);

  useEffect(()=>{
    try {
      const stored=window.localStorage.getItem(cacheKey);
      if(stored){
        const parsed=personalizationPatchSchema.parse(JSON.parse(stored));
        const storedAssets=window.localStorage.getItem(cacheKey+":assets");
        const parsedAssets=storedAssets?JSON.parse(storedAssets) as VerifiedCustomerAsset[]:[];
        if(!Array.isArray(parsedAssets))throw Error("INVALID_ASSET_CACHE");
        personalizeDocument(source,contract,parsed,parsedAssets,true);
        setCustomerAssets(parsedAssets);
        setPatch(parsed);
        setStatus(dictionary[locale].restore);
      }
    }catch{
      setWarning(dictionary[locale].invalidDraft);
    }finally{setHydrated(true);}
  },[cacheKey,source,contract,locale]);

  useEffect(()=>{
    if(!hydrated)return;
    try {
      if(Object.keys(patch.values).length || patch.locale){
        window.localStorage.setItem(cacheKey,JSON.stringify(patch));
        window.localStorage.setItem(cacheKey+":assets",JSON.stringify(customerAssets));
      }else{
        window.localStorage.removeItem(cacheKey);
        window.localStorage.removeItem(cacheKey+":assets");
      }
      setStatus(dictionary[locale].saveLocal);
    }catch{setWarning(dictionary[locale].storageError);}
  },[cacheKey,patch,customerAssets,hydrated,locale]);

  useEffect(()=>{
    // R2 read capabilities expire quickly. Refresh only trusted signed URLs;
    // do not replace the version-pinned source document while the user edits.
    const api=process.env.NEXT_PUBLIC_API_URL;
    if(!api)return;
    let active=true;
    const refresh=async()=>{
      try{
        const response=await fetch((api.endsWith("/")?api.slice(0,-1):api)+"/catalog/templates/"+encodeURIComponent(slug),{cache:"no-store"});
        if(!response.ok)return;
        const data=await response.json() as {templateVersionId?:string;mediaUrls?:Record<string,string>};
        if(!active||data.templateVersionId!==versionId||!data.mediaUrls)return;
        const valid=Object.values(data.mediaUrls).every(raw=>{
          const url=new URL(raw);
          return url.protocol==="https:"&&url.hostname.endsWith(".r2.cloudflarestorage.com");
        });
        if(valid)setTemplateUrls(data.mediaUrls);
      }catch{}
    };
    const timer=window.setInterval(()=>void refresh(),45_000);
    return()=>{active=false;window.clearInterval(timer);};
  },[slug,versionId]);

  useEffect(()=>{
    if(!customerAssets.length)return;
    let active=true;
    const refresh=async()=>{
      try{
        const entries=await Promise.all(customerAssets.map(async asset=>{
          const id=asset.storageKey.slice("asset:".length);
          const data=await customerApi<{url:string;expiresInSeconds:number}>(
            "/customer/media/"+encodeURIComponent(id)+"/read-url");
          const url=new URL(data.url);
          if(url.protocol!=="https:"||!url.hostname.endsWith(".r2.cloudflarestorage.com"))throw Error("INVALID_URL");
          return [asset.storageKey,data.url] as const;
        }));
        if(active)setCustomerUrls(old=>({...old,...Object.fromEntries(entries)}));
      }catch{}
    };
    const timer=window.setInterval(()=>void refresh(),45_000);
    return()=>{active=false;window.clearInterval(timer);};
  },[customerAssets]);

  const document=useMemo(()=>personalizeDocument(source,contract,patch,customerAssets,true),[source,contract,patch,customerAssets]);
  const mergedUrls=useMemo(()=>({...templateUrls,...customerUrls}),[templateUrls,customerUrls]);
  const issues=useMemo(()=>personalizationIssues(document,contract),[document,contract]);
  const grouped=useMemo(()=>contract.fields.reduce<Record<Step,EditableField[]>>((acc,field)=>{
    acc[sectionToStep[field.section]].push(field);
    return acc;
  },{main:[],event:[],appearance:[],publish:[]}),[contract]);
  const currentIndex=steps.indexOf(step);
  const filledCount=contract.fields.length-issues.length;
  const completion=contract.fields.length?Math.max(0,Math.round(filledCount/contract.fields.length*100)):100;
  const fields=grouped[step];
  const update=(id:string,value:PersonalizedValue)=>{
    const candidate={...patch,values:{...patch.values,[id]:value}};
    try{personalizeDocument(source,contract,candidate,customerAssets,true);setPatch(candidate);setWarning("");setReview(false);}
    catch(error){setWarning(error instanceof Error?error.message:"Invalid value");}
  };
  const changeLocale=(lang:"ru"|"ky")=>{
    try {
      const candidate={...patch,locale:lang};
      personalizeDocument(source,contract,candidate,customerAssets,true);
      setPatch(candidate);setWarning("");
    }catch(error){setWarning(error instanceof Error?error.message:"Invalid locale");}
  };
  const reset=()=>{
    if(!window.confirm(t.resetConfirm))return;
    setPatch(initialPatch(source,contract));setCustomerAssets([]);setCustomerUrls({});setReview(false);setWarning("");setStep("main");setMode("edit");
  };
  const forward=()=>{
    if(step!=="publish"){
      setStep(steps[currentIndex+1]);setMode("edit");window.scrollTo({top:0,behavior:"auto"});
      return;
    }
    setReview(true);
    try{finalizePersonalization(source,contract,patch,customerAssets,true);setWarning("");}
    catch{setWarning(t.required);}
  };
  const fieldError=new Set(issues.map(issue=>issue.fieldId));
  const hasFields=contract.fields.length>0;
  const jumpPreview=(pageId:string)=>{
    setMode("preview");
    window.requestAnimationFrame(()=>{
      const section=Array.from(window.document.querySelectorAll<HTMLElement>("[data-preview-page]"))
        .find(node=>node.dataset.previewPage===pageId);
      section?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
    });
  };
  const preview=<StudioV2ProjectRenderer
    key={previewRun} document={document} mediaUrls={mergedUrls}
    device="mobile" guest={{mode:"preview"}}/>;

  return <main className="ce-shell">
    <header className="ce-header">
      <Link aria-label={t.back} href={`/${locale}/catalog/${slug}`} className="ce-icon"><ArrowLeft size={20}/></Link>
      <Link href={`/${locale}`} className="ce-logo">eventiq<span>.</span></Link>
      <Link className="ce-account-link" href={`/${locale}/invitations`}>{locale==="ru"?"Мои приглашения":"Менин чакырууларым"}</Link>
      <div className="ce-save-state" role="status"><Save size={14}/><span>{hydrated?status||t.saveLocal:t.notSaved}</span></div>
    </header>
    <div className="ce-layout">
      <section className="ce-controls" aria-label={t.title}>
        <div className="ce-intro">
          <p className="ce-eyebrow">{t.template} / {name}</p>
          <h1>{t.title}</h1>
          <p>{t.welcome}</p>
        </div>
        <div className="ce-completion" role="status" aria-live="polite">
          <div className="ce-completion-copy"><span>{t.filled}: {filledCount} {t.of} {contract.fields.length}</span><strong>{completion}%</strong></div>
          <div className="ce-completion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion} aria-label={t.filled}>
            <span style={{width:completion+"%"}}/>
          </div>
        </div>
        <nav className="ce-progress" aria-label={t.step}>
          {steps.map((item,index)=><button type="button" key={item}
            aria-current={step===item?"step":undefined} onClick={()=>{setStep(item);setMode("edit");}}
            className={index===currentIndex?"ce-progress-current":""}>
            <span className="ce-progress-bar"/>
            <span className="ce-step-label"><span className="ce-step-number">{index<currentIndex?<Check size={12}/>:index+1}</span>{t[item]}</span>
          </button>)}
        </nav>
        <div className="ce-mobile-tabs" role="group" aria-label={t.preview}>
          <button className={mode==="edit"?"active":""} aria-pressed={mode==="edit"} onClick={()=>setMode("edit")}><Pencil size={16}/>{t.edit}</button>
          <button className={mode==="preview"?"active":""} aria-pressed={mode==="preview"} onClick={()=>setMode("preview")}><Eye size={16}/>{t.preview}</button>
        </div>
        <div className={mode==="preview"?"ce-form ce-mobile-hidden":"ce-form"}>
          <div className="ce-step-heading">
            <p>{t.step} {currentIndex+1} {t.stepOf} 4</p>
            <h2>{step==="publish"?t.publishTitle:t[step]}</h2>
            {step!=="publish"&&<p className="ce-step-hint">{t.editorTip}</p>}
          </div>
          {contract.locales.length>1&&step==="main"&&
            <label className="ce-language"><span>{t.language}</span>
              <select value={document.locale} onChange={e=>changeLocale(e.target.value as "ru"|"ky")}>
                {contract.locales.map(lang=><option key={lang} value={lang}>{lang==="ru"?"Русский":"Кыргызча"}</option>)}
              </select>
            </label>}
          {step==="publish"?
            <div className="ce-review">
              <p>{t.publishInfo}</p>
              {issues.length?<div role="status"><strong>{t.required}</strong>
                {issues.map((issue,index)=>{
                  const field=contract.fields.find(f=>f.id===issue.fieldId);
                  return <button type="button" className="ce-issue" key={issue.fieldId+index}
                    onClick={()=>{setStep(field?sectionToStep[field.section]:"main");setMode("edit");}}>
                    {field?.label[locale]??issue.fieldId}: {issue.message} <ArrowRight size={14}/>
                  </button>;
                })}
              </div>:<p className="ce-valid"><Check size={17}/>{t.ready}</p>}
              <p className="ce-notice">{t.noPublish}</p>
              <button type="button" className="ce-secondary" onClick={()=>{setPreviewRun(n=>n+1);setMode("preview");}}><Eye size={16}/>{t.preview}</button>
            </div>:
            fields.length?fields.map(field=>
              <div className={review&&fieldError.has(field.id)?"ce-field-invalid":""} key={field.id}>
                <SimpleField field={field} value={readPersonalizedValue(document,field)}
                  document={document} locale={locale} locales={contract.locales}
                  urls={mergedUrls} onChange={value=>update(field.id,value)}/>
              </div>):
              <p className="ce-empty">{hasFields?t.noFields:t.unsupported}</p>}
          <div className={step==="appearance"||step==="publish"?"ce-cloud-mount":"ce-cloud-mount ce-cloud-mount-hidden"}>
            <CustomerCloudControls
            locale={locale} templateVersionId={versionId} preferredDraftId={preferredDraftId} patch={patch}
            publishMode={step==="publish"} canPublish={issues.length===0}
            uploadTargets={grouped.appearance.reduce<
              Array<{id:string;label:string;kind:"image"|"gallery";minWidth:number;minHeight:number}>
            >((targets,f)=>{
              if(f.kind==="image")targets.push({id:f.id,label:f.label[locale],kind:"image",
                minWidth:f.minWidth,minHeight:f.minHeight});
              else if(f.kind==="gallery")targets.push({id:f.id,label:f.label[locale],kind:"gallery",
                minWidth:1,minHeight:1});
              return targets;
            },[])}
            onLoad={(remote,assets,urls)=>{
              try{
                personalizeDocument(source,contract,remote,assets,true);
                setCustomerAssets(assets);setCustomerUrls(urls);setPatch(remote);
                setWarning("");setStatus(t.restore);
              }catch{setWarning(t.invalidDraft);}
            }}
            onUploaded={(fieldId,asset,url)=>{
              const nextAssets=[...customerAssets.filter(a=>a.id!==asset.id),asset];
              const field=contract.fields.find(f=>f.id===fieldId);
              const current=field?readPersonalizedValue(document,field):undefined;
              const nextValue=field?.kind==="gallery"?
                {kind:"gallery" as const,assetIds:[...(current?.kind==="gallery"?current.assetIds:[]),asset.id]}:
                {kind:"image" as const,assetId:asset.id};
              const nextPatch={...patch,values:{...patch.values,[fieldId]:nextValue}};
              try{
                personalizeDocument(source,contract,nextPatch,nextAssets,true);
                setCustomerAssets(nextAssets);setCustomerUrls(v=>({...v,[asset.storageKey]:url}));
                setPatch(nextPatch);setWarning("");
              }catch{setWarning(t.invalidDraft);}
            }}
            />
          </div>
          <p className="ce-security-note">{t.original}</p>
          {warning&&<p className="ce-warning" role="alert">{warning}</p>}
        </div>
        <footer className={mode==="preview"?"ce-footer ce-mobile-hidden":"ce-footer"}>
          <button type="button" className="ce-secondary" onClick={currentIndex?()=>{setStep(steps[currentIndex-1]);setMode("edit");}:reset}>
            {currentIndex?t.back:t.reset}
          </button>
          <button type="button" className="ce-primary" onClick={forward}>
            {step==="publish"?t.review:t.next}<ArrowRight size={17}/>
          </button>
        </footer>
      </section>
      <aside className={mode==="edit"?"ce-preview ce-mobile-hidden":"ce-preview"} aria-label={t.preview}>
        <div className="ce-preview-head">
          <div><strong>{t.preview}</strong><small>{name}</small></div>
          <button className="ce-secondary" aria-label={locale==="ru"?"Перезапустить анимации":"Анимацияны кайра баштоо"} type="button" onClick={()=>setPreviewRun(n=>n+1)}><RotateCcw size={15}/></button>
        </div>
        <nav className="ce-preview-sections" aria-label={t.sections}>
          {source.pages.map((page,index)=><button key={page.id} type="button" onClick={()=>jumpPreview(page.id)}
            title={page.name}>{String(index+1).padStart(2,"0")} <span>{page.name.replace(/^[0-9]+\\s*\\/\\s*/, "")}</span></button>)}
        </nav>
        <div className="ce-preview-screen">{preview}</div>
      </aside>
    </div>
  </main>;
}
