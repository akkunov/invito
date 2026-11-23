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
import "./customer-mobile-editor.css";

type Step="main"|"event"|"appearance"|"publish";
const steps:readonly Step[]=["main","event","appearance","publish"];
const sectionToStep:Record<EditableField["section"],Step>={
  main:"main",date:"event",location:"event",schedule:"event",
  photos:"appearance",music:"appearance",appearance:"appearance",rsvp:"appearance",
};
const dictionary={
  ru:{
    main:"Основное",event:"Дата и место",appearance:"Оформление",publish:"Проверка",
    preview:"Предпросмотр",edit:"Изменить",back:"Назад",next:"Продолжить",
    title:"Ваше приглашение",welcome:"Заполните данные — изменения сразу появятся в приглашении.",
    saveLocal:"Сохранено на этом устройстве",notSaved:"Черновик ещё не сохранён",restore:"Черновик восстановлен",
    publishTitle:"Проверьте приглашение",publishInfo:"Публикация личных приглашений пока не подключена. Ваши изменения сохраняются только в этом браузере.",
    ready:"Все обязательные поля заполнены.",required:"Нужно исправить поля:",reset:"Сбросить",
    resetConfirm:"Удалить локальные изменения и вернуться к исходному шаблону?",
    language:"Язык приглашения",noFields:"На этом шаге нет полей для выбранного шаблона.",
    template:"Шаблон",step:"Шаг",stepOf:"из",review:"Проверить заполнение",saved:"Черновик сохранён",
    storageError:"Не удалось сохранить черновик на устройстве. Не закрывайте вкладку.",
    invalidDraft:"Сохранённый черновик повреждён и не применён.",
    unsupported:"Для редактирования этого шаблона пока не назначены поля.",
    original:"Дизайн защищён. Можно изменить только разрешённые автором данные.",
    noPublish:"Публикация станет доступна после подключения личных приглашений.",
  },
  ky:{
    main:"Негизги маалымат",event:"Күнү жана жери",appearance:"Жасалгалоо",publish:"Текшерүү",
    preview:"Алдын ала көрүү",edit:"Өзгөртүү",back:"Артка",next:"Улантуу",
    title:"Сиздин чакырууңуз",welcome:"Маалыматты толтуруңуз — өзгөрүүлөр чакырууда дароо көрүнөт.",
    saveLocal:"Бул түзмөктө сакталды",notSaved:"Азырынча сакталган жок",restore:"Черновик калыбына келди",
    publishTitle:"Чакырууну текшериңиз",publishInfo:"Жеке чакырууну жарыялоо азырынча кошула элек. Өзгөрүүлөр ушул браузерде гана сакталат.",
    ready:"Милдеттүү талаалар толтурулду.",required:"Төмөнкүлөрдү оңдоңуз:",reset:"Баштапкы абал",
    resetConfirm:"Жергиликтүү өзгөрүүлөрдү өчүрүп, баштапкы шаблонго кайтуубу?",
    language:"Чакыруунун тили",noFields:"Бул этапта тандалган шаблондун талаалары жок.",
    template:"Шаблон",step:"Кадам",stepOf:" ичинен",review:"Толтурууну текшерүү",saved:"Черновик сакталды",
    storageError:"Черновикти сактоо мүмкүн болбоду. Баракты жаппаңыз.",
    invalidDraft:"Сакталган черновик бузулган, колдонулган жок.",
    unsupported:"Бул шаблондун өзгөртүү талаалары азырынча көрсөтүлө элек.",
    original:"Дизайн корголгон. Автор уруксат берген маалымат гана өзгөрөт.",
    noPublish:"Жеке чакыруулар кошулганда жарыялоо жеткиликтүү болот.",
  },
} as const;

type Props={
  locale:Locale;slug:string;name:string;versionId:string;
  source:ProjectDocumentV2;contract:PersonalizationContract;
  mediaUrls:Record<string,string>;
};
const blank=():PersonalizationPatch=>({values:{}});
const draftStorageKey=(id:string)=>"eventiq:customer-draft:v1:"+id;

export function CustomerMobileEditor({locale,slug,name,versionId,source,contract,mediaUrls}:Props){
  const t=dictionary[locale];
  const [step,setStep]=useState<Step>("main");
  const [mode,setMode]=useState<"edit"|"preview">("edit");
  const [patch,setPatch]=useState<PersonalizationPatch>(blank);
  const [hydrated,setHydrated]=useState(false);
  const [warning,setWarning]=useState("");
  const [status,setStatus]=useState("");
  const [review,setReview]=useState(false);
  const [previewRun,setPreviewRun]=useState(0);
  const cacheKey=draftStorageKey(versionId);

  useEffect(()=>{
    try {
      const stored=window.localStorage.getItem(cacheKey);
      if(stored){
        const parsed=personalizationPatchSchema.parse(JSON.parse(stored));
        personalizeDocument(source,contract,parsed);
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
      }else{
        window.localStorage.removeItem(cacheKey);
      }
      setStatus(dictionary[locale].saveLocal);
    }catch{setWarning(dictionary[locale].storageError);}
  },[cacheKey,patch,hydrated,locale]);

  const document=useMemo(()=>personalizeDocument(source,contract,patch),[source,contract,patch]);
  const issues=useMemo(()=>personalizationIssues(document,contract),[document,contract]);
  const grouped=useMemo(()=>contract.fields.reduce<Record<Step,EditableField[]>>((acc,field)=>{
    acc[sectionToStep[field.section]].push(field);
    return acc;
  },{main:[],event:[],appearance:[],publish:[]}),[contract]);
  const currentIndex=steps.indexOf(step);
  const fields=grouped[step];
  const update=(id:string,value:PersonalizedValue)=>{
    const candidate={...patch,values:{...patch.values,[id]:value}};
    try{personalizeDocument(source,contract,candidate);setPatch(candidate);setWarning("");setReview(false);}
    catch(error){setWarning(error instanceof Error?error.message:"Invalid value");}
  };
  const changeLocale=(lang:"ru"|"ky")=>{
    try {
      const candidate={...patch,locale:lang};
      personalizeDocument(source,contract,candidate);
      setPatch(candidate);setWarning("");
    }catch(error){setWarning(error instanceof Error?error.message:"Invalid locale");}
  };
  const reset=()=>{
    if(!window.confirm(t.resetConfirm))return;
    setPatch(blank());setReview(false);setWarning("");setStep("main");setMode("edit");
  };
  const forward=()=>{
    if(step!=="publish"){
      setStep(steps[currentIndex+1]);setMode("edit");window.scrollTo({top:0,behavior:"auto"});
      return;
    }
    setReview(true);
    try{finalizePersonalization(source,contract,patch);setWarning("");}
    catch{setWarning(t.required);}
  };
  const fieldError=new Set(issues.map(issue=>issue.fieldId));
  const hasFields=contract.fields.length>0;
  const preview=<StudioV2ProjectRenderer
    key={previewRun} document={document} mediaUrls={mediaUrls}
    device="mobile" guest={{mode:"preview"}}/>;

  return <main className="ce-shell">
    <header className="ce-header">
      <Link aria-label={t.back} href={`/${locale}/catalog/${slug}`} className="ce-icon"><ArrowLeft size={20}/></Link>
      <Link href={`/${locale}`} className="ce-logo">eventiq<span>.</span></Link>
      <div className="ce-save-state" role="status"><Save size={14}/><span>{hydrated?status||t.saveLocal:t.notSaved}</span></div>
    </header>
    <div className="ce-layout">
      <section className="ce-controls" aria-label={t.title}>
        <div className="ce-intro">
          <p className="ce-eyebrow">{t.template} / {name}</p>
          <h1>{t.title}</h1>
          <p>{t.welcome}</p>
        </div>
        <nav className="ce-progress" aria-label={t.step}>
          {steps.map((item,index)=><button type="button" key={item}
            aria-current={step===item?"step":undefined} onClick={()=>{setStep(item);setMode("edit");}}
            className={index===currentIndex?"ce-progress-current":""}>
            <span className="ce-progress-bar"/>
            <span className="ce-step-label">{index+1}. {t[item]}</span>
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
                  urls={mediaUrls} onChange={value=>update(field.id,value)}/>
              </div>):
              <p className="ce-empty">{hasFields?t.noFields:t.unsupported}</p>}
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
          <button className="ce-secondary" type="button" onClick={()=>setPreviewRun(n=>n+1)}><RotateCcw size={15}/></button>
        </div>
        <div className="ce-preview-screen">{preview}</div>
      </aside>
    </div>
  </main>;
}
