"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";
import {personalizeDocument,personalizationIssues,readPersonalizedValue,finalizePersonalization} from "@/features/studio-v2/core/personalization";
import type {EditableField,PersonalizationContract,PersonalizationPatch,PersonalizedValue} from "@/features/studio-v2/core/personalization.schema";
import {DEVICE_WIDTH,type Device} from "@/features/studio-v2/core/responsive-engine";
import {StudioV2ProjectRenderer} from "./studio-v2-project-renderer";
import {useMediaUrls} from "./studio-v2-assets";
import {StudioIcon,type StudioIconName} from "./studio-icon";
import {SimpleField} from "./studio-v2-simple-fields";
type Section=EditableField["section"];
type Locale="ru"|"ky";
const sections:readonly {id:Section;ru:string;ky:string;descRu:string;descKy:string;icon:StudioIconName}[]=[
 {id:"main",ru:"Основное",ky:"Негизги маалымат",descRu:"Имена, приветствие и детали вашего события.",descKy:"Ысымдар, саламдашуу жана тойдун маалыматы.",icon:"text"},
 {id:"date",ru:"Дата и время",ky:"Күнү жана убактысы",descRu:"Когда состоится ваше торжество.",descKy:"Той качан өтөт.",icon:"frame"},
 {id:"photos",ru:"Фотографии",ky:"Сүрөттөр",descRu:"Добавьте личный штрих к приглашению.",descKy:"Чакырууңузду сүрөттөр менен толуктаңыз.",icon:"image"},
 {id:"location",ru:"Место проведения",ky:"Өтчү жер",descRu:"Помогите гостям найти место встречи.",descKy:"Конокторго тойдун дарегин табууга жардам бериңиз.",icon:"map"},
 {id:"schedule",ru:"Программа",ky:"Программа",descRu:"Расскажите, как пройдёт этот день.",descKy:"Тойдун программасын түзүңүз.",icon:"layers"},
 {id:"music",ru:"Музыка",ky:"Музыка",descRu:"Выберите настроение для приглашения.",descKy:"Чакыруу үчүн музыка тандаңыз.",icon:"animation"},
 {id:"rsvp",ru:"Подтверждение участия",ky:"Катышууну ырастоо",descRu:"Укажите параметры ответа гостей.",descKy:"Коноктордун жооп берүү шарттарын көрсөтүңүз.",icon:"check"},
 {id:"appearance",ru:"Оформление",ky:"Жасалгалоо",descRu:"Выберите один из авторских вариантов дизайна.",descKy:"Дизайнер даярдаган жасалгалардан тандаңыз.",icon:"styles"},
];
type Props={source:ProjectDocumentV2;contract:PersonalizationContract;name:string;version:number;onClose:()=>void};
export function SimpleEditor({source,contract,name,version,onClose}:Props){
 const [patch,setPatch]=useState<PersonalizationPatch>(()=>({values:{},...(!contract.locales.includes(source.locale)?{locale:contract.locales[0]}:{})})),[error,setError]=useState(""),[notice,setNotice]=useState(""),[uiLocale,setUiLocale]=useState<Locale>(source.locale);
 const available=sections.filter(s=>contract.fields.some(f=>f.section===s.id));
 const [section,setSection]=useState<Section>(available[0]?.id??"main"),[device,setDevice]=useState<Device>("mobile"),[mode,setMode]=useState<"edit"|"preview">("edit");
 const [previewRun,setPreviewRun]=useState(0),[review,setReview]=useState(false);
 const editorRef=useRef<HTMLDivElement>(null),closeRef=useRef<HTMLButtonElement>(null),previewRef=useRef<HTMLDivElement>(null);
 const draft=useMemo(()=>personalizeDocument(source,contract,patch),[source,contract,patch]);
 const urls=useMediaUrls(draft.assets),issues=useMemo(()=>personalizationIssues(draft,contract),[draft,contract]);
 const t=(ru:string,ky:string)=>uiLocale==="ky"?ky:ru;
 const current=available.find(s=>s.id===section)??available[0],index=available.findIndex(s=>s.id===current?.id),fields=contract.fields.filter(f=>f.section===current?.id);
 const dirty=Object.keys(patch.values).length>0||patch.locale!==undefined&&patch.locale!==source.locale;
 function update(next:PersonalizationPatch){try{personalizeDocument(source,contract,next);setPatch(next);setError("");setNotice("");setReview(false);}catch(e){setError(e instanceof Error?e.message:t("Недопустимое значение","Маани туура эмес"));}}
 function choose(next:Section){setSection(next);setMode("edit");setError("");setNotice("");editorRef.current?.scrollTo({top:0});}
 function close(){if(dirty&&!window.confirm(t("Закрыть тестовый редактор? Изменения этой сессии не сохраняются.","Редактор жабылсынбы? Өзгөртүүлөр сакталбайт.")))return;onClose();}
 useEffect(()=>{closeRef.current?.focus();},[]);
 useEffect(()=>{previewRef.current?.scrollTo({top:0});},[device,previewRun]);
 function check(){setReview(true);setError("");try{finalizePersonalization(source,contract,patch);setNotice(t("Приглашение заполнено. Публикация будет доступна после подключения сервера.","Чакыруу толтурулду. Сервер кошулгандан кийин жарыялай аласыз."));}catch{setNotice(t("Проверьте обязательные поля и ограничения.","Милдеттүү талааларды жана чектөөлөрдү текшериңиз."));}}
 return <div className="se-shell" role="dialog" aria-modal="true" aria-label="Simple Editor">
  <header className="se-header">
   <div className="se-brand"><button ref={closeRef} className="se-icon-button" aria-label={t("Вернуться в менеджер","Менеджерге кайтуу")} onClick={close}><StudioIcon name="back" size={20}/></button><strong>invito<span>.</span></strong><span className="se-brand-divider"/><span className="se-template-name">{name}<small> / v{version}</small></span></div>
   <div className="se-header-actions"><span className="se-draft-label"><i/>{t("Тестовый режим","Сыноо режими")}</span><div className="se-language" role="group" aria-label={t("Язык интерфейса","Интерфейстин тили")}>{(["ru","ky"] as const).map(l=><button key={l} aria-pressed={uiLocale===l} onClick={()=>setUiLocale(l)}>{l.toUpperCase()}</button>)}</div><button className="se-primary" onClick={check}>{t("Проверить","Текшерүү")}<StudioIcon name="check"/></button></div>
  </header>
  <div className="se-mobile-switch" role="group" aria-label={t("Режим редактора","Редактор режими")}><button aria-pressed={mode==="edit"} onClick={()=>setMode("edit")}>{t("Редактирование","Өзгөртүү")}</button><button aria-pressed={mode==="preview"} onClick={()=>setMode("preview")}>{t("Предпросмотр","Алдын ала көрүү")}</button></div>
  <div className="se-body" data-mode={mode}>
   <aside className="se-navigation"><div className="se-nav-title"><small>01 / {t("ПЕРСОНАЛИЗАЦИЯ","ЖЕКЕЛЕШТИРҮҮ")}</small><h2>{t("Ваше приглашение","Сиздин чакырууңуз")}</h2></div>
    <nav aria-label={t("Разделы приглашения","Чакыруу бөлүмдөрү")}>{available.map(s=><button key={s.id} aria-current={current?.id===s.id?"step":undefined} onClick={()=>choose(s.id)}><StudioIcon name={s.icon}/><span>{s[uiLocale]}</span>{contract.fields.filter(f=>f.section===s.id).some(f=>issues.some(i=>i.fieldId===f.id))?<span className="se-nav-dot"/>:<StudioIcon className="se-nav-check" name="check" size={13}/>}</button>)}</nav>
    <div className="se-nav-bottom"><StudioIcon name="lock"/><span>{t("Дизайн защищён. Меняйте только содержимое.","Дизайн корголгон. Мазмунун гана өзгөртүңүз.")}</span></div>
   </aside>
   <section className="se-form" ref={editorRef} aria-label={t("Настройки приглашения","Чакыруу жөндөөлөрү")}>
    <div className="se-form-content">
     <div className="se-form-kicker">{current?String(index+1).padStart(2,"0")+" / "+String(available.length).padStart(2,"0"):"00 / 00"}</div>
     <h1>{current?current[uiLocale]:t("Готовый дизайн","Даяр дизайн")}</h1><p className="se-description">{current?(uiLocale==="ky"?current.descKy:current.descRu):t("Дизайнер пока не разрешил редактирование полей этого шаблона. Можно посмотреть приглашение.","Дизайнер азырынча бул шаблондун талааларын өзгөртүүгө уруксат берген жок.")}</p>
     {contract.locales.length>1&&<label className="se-control se-invitation-language"><span>{t("Язык приглашения","Чакыруу тили")}</span><select aria-label={t("Язык приглашения","Чакыруу тили")} value={draft.locale} onChange={e=>update({...patch,locale:e.target.value as Locale})}>{contract.locales.map(l=><option key={l} value={l}>{l==="ru"?"Русский":"Кыргызча"}</option>)}</select></label>}
     {fields.map(f=><SimpleField key={f.id} field={f} value={readPersonalizedValue(draft,f)} document={draft} locale={uiLocale} locales={contract.locales} onChange={value=>update({...patch,values:{...patch.values,[f.id]:value}})}/>)}
     {error&&<p role="alert" className="se-error">{error}</p>}
     {notice&&<p role="status" className="se-notice">{notice}</p>}
     {review&&issues.length>0&&<div className="se-review">{issues.map((issue,i)=><button key={i} className="se-text-button" onClick={()=>{const field=contract.fields.find(f=>f.id===issue.fieldId);if(field){choose(field.section);setReview(true);}}}>{contract.fields.find(f=>f.id===issue.fieldId)?.label[uiLocale]??issue.fieldId}: {issue.message}</button>)}</div>}
     <div className="se-form-footer"><button className="se-secondary" disabled={!dirty} onClick={()=>{if(window.confirm(t("Сбросить изменения?","Өзгөртүүлөр кайтарылсынбы?")))update({values:{},...(!contract.locales.includes(source.locale)?{locale:contract.locales[0]}:{})});}}><StudioIcon name="undo"/> {t("Сбросить","Кайтаруу")}</button>{index>=0&&index<available.length-1?<button className="se-primary" onClick={()=>choose(available[index+1].id)}>{t("Далее","Кийинки")}<StudioIcon name="chevron"/></button>:<button className="se-primary" onClick={check}>{t("Проверить","Текшерүү")}<StudioIcon name="check"/></button>}</div>
     <p className="se-local-note">{t("Изменения существуют только в этой тестовой сессии. Исходный шаблон не изменяется.","Өзгөртүүлөр ушул сыноо сессиясында гана болот. Баштапкы шаблон өзгөрбөйт.")}</p>
    </div>
   </section>
   <section className="se-preview" aria-label={t("Живой предпросмотр","Жандуу алдын ала көрүү")}>
    <div className="se-preview-toolbar"><div><strong>{t("Предпросмотр","Алдын ала көрүү")}</strong><small>{DEVICE_WIDTH[device]} px · {draft.locale.toUpperCase()}</small></div><div className="se-devices" role="group" aria-label={t("Устройство","Түзмөк")}>{(["desktop","tablet","mobile"] as const).map(d=><button key={d} aria-label={({desktop:"Desktop",tablet:"Tablet",mobile:"Mobile"})[d]} title={d} aria-pressed={device===d} onClick={()=>setDevice(d)}><StudioIcon name={d==="mobile"?"phone":d==="tablet"?"responsive":"frame"} size={19}/></button>)}</div><button className="se-icon-button" title={t("Повторить анимацию","Анимацияны кайталоо")} aria-label={t("Повторить анимацию","Анимацияны кайталоо")} onClick={()=>setPreviewRun(n=>n+1)}><StudioIcon name="play"/></button></div>
    <div className="se-preview-scroll" ref={previewRef}><div className="se-artwork" data-device={device} style={{width:DEVICE_WIDTH[device],maxWidth:"100%"}}><StudioV2ProjectRenderer key={previewRun} document={draft} mediaUrls={urls} device={device} guest={{mode:"preview"}}/></div></div>
   </section>
  </div>
 </div>;
}
