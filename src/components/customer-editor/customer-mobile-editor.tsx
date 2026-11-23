"use client";

import Link from "next/link";
import {useEffect,useMemo,useRef,useState,type MouseEvent} from "react";
import {ArrowLeft,ArrowRight,Check,Eye,Pencil,RotateCcw,RotateCw,Save,X,Type,Image as ImageIcon,Layers,Palette,Music2,Send,Cloud,ChevronDown,LockKeyhole,MoreHorizontal,EyeOff,ArrowUp,ArrowDown,Plus} from "lucide-react";
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
import {editableFieldForNode} from "@/features/invitations/mobile-editor-selection";
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
    mobileHint:"Нажмите на текст или фото, чтобы изменить",mobileEdit:"Редактировать",mobileClose:"Закрыть настройки",mobilePage:"Страница",mobileSelection:"Настройки элемента",mobileCheck:"Проверка и публикация",mobileEvent:"Дата и программа",mobileDesign:"Фото и оформление",
    toolText:"Текст",toolPhotos:"Фото",toolStyle:"Стиль",toolMusic:"Музыка",mobileDone:"Готово",mobileLocked:"Оформление этой секции зафиксировано дизайнером.",mobileNoMusic:"Для этого шаблона не предусмотрена смена музыки.",mobileStyleHint:"Можно выбрать только оформление, разрешённое автором шаблона.",mobileSectionsHint:"Выберите страницу для редактирования. Порядок и состав страниц задаются автором шаблона.",mobileUndo:"Отменить",mobileRedo:"Повторить",mobileSaved:"Сохранено на устройстве",mobileSaving:"Сохранение...",mobileSectionsTitle:"Секции приглашения",mobileViewPage:"Открыть страницу",
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
    mobileHint:"Өзгөртүү үчүн текстти же сүрөттү басыңыз",mobileEdit:"Өзгөртүү",mobileClose:"Жөндөөлөрдү жабуу",mobilePage:"Барак",mobileSelection:"Элементтин жөндөөлөрү",mobileCheck:"Текшерүү жана жарыялоо",mobileEvent:"Күнү жана программа",mobileDesign:"Сүрөттөр жана жасалгалоо",
    toolText:"Текст",toolPhotos:"Сүрөт",toolStyle:"Стиль",toolMusic:"Музыка",mobileDone:"Даяр",mobileLocked:"Бул бөлүмдүн жасалгасы автор тарабынан бекитилген.",mobileNoMusic:"Бул шаблондо музыка өзгөртүлбөйт.",mobileStyleHint:"Автор уруксат берген гана жасалгаларды тандоого болот.",mobileSectionsHint:"Өзгөртүү үчүн баракты тандаңыз. Барактардын иретин шаблондун автору аныктайт.",mobileUndo:"Артка кайтаруу",mobileRedo:"Кайталоо",mobileSaved:"Түзмөктө сакталды",mobileSaving:"Сакталууда...",mobileSectionsTitle:"Чакыруу бөлүмдөрү",mobileViewPage:"Баракты ачуу",
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
  const mobileFormRef=useRef<HTMLDivElement>(null);
  const mobileCanvasRef=useRef<HTMLDivElement>(null);
  const mobileTriggerRef=useRef<HTMLButtonElement|null>(null);
  const [isMobileViewport,setIsMobileViewport]=useState(false);
  const [mobileSheetOpen,setMobileSheetOpen]=useState(false);
  const [selectedFieldId,setSelectedFieldId]=useState<string|null>(null);
  const [activeMobilePage,setActiveMobilePage]=useState(0);
  const [mobileTool,setMobileTool]=useState<"text"|"photo"|"style"|"music">("text");
  const [mobileSectionsOpen,setMobileSectionsOpen]=useState(false);
  const [past,setPast]=useState<PersonalizationPatch[]>([]);
  const [future,setFuture]=useState<PersonalizationPatch[]>([]);
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
    const media=window.matchMedia("(max-width: 850px)");
    const sync=()=>setIsMobileViewport(media.matches);
    sync();media.addEventListener("change",sync);
    return()=>media.removeEventListener("change",sync);
  },[]);

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
  const visiblePages=useMemo(()=>document.pages.filter(page=>document.nodes[page.rootNodeId]?.visible!==false),[document]);
  const activePageIndex=Math.min(activeMobilePage,Math.max(0,visiblePages.length-1));
  const issues=useMemo(()=>personalizationIssues(document,contract),[document,contract]);
  const grouped=useMemo(()=>contract.fields.reduce<Record<Step,EditableField[]>>((acc,field)=>{
    acc[sectionToStep[field.section]].push(field);
    return acc;
  },{main:[],event:[],appearance:[],publish:[]}),[contract]);
  const uploadTargets=useMemo(()=>grouped.appearance.reduce<
    Array<{id:string;label:string;kind:"image"|"gallery";minWidth:number;minHeight:number}>
  >((targets,field)=>{
    if(field.kind==="image")targets.push({id:field.id,label:field.label[locale],kind:"image",
      minWidth:field.minWidth,minHeight:field.minHeight});
    else if(field.kind==="gallery")targets.push({id:field.id,label:field.label[locale],kind:"gallery",
      minWidth:1,minHeight:1});
    return targets;
  },[]),[grouped,locale]);
  const currentIndex=steps.indexOf(step);
  const filledCount=contract.fields.length-issues.length;
  const completion=contract.fields.length?Math.max(0,Math.round(filledCount/contract.fields.length*100)):100;
  const fields=grouped[step];
  const displayedFields=selectedFieldId?fields.filter(field=>field.id===selectedFieldId):
    isMobileViewport&&step==="appearance"?fields.filter(field=>mobileTool==="photo"
      ?field.kind==="image"||field.kind==="gallery"
      :mobileTool==="style"?field.kind==="theme":field.kind==="music"):fields;
  const commitPatch=(next:PersonalizationPatch)=>{
    setPast(old=>[...old,patch].slice(-30));setFuture([]);setPatch(next);
  };
  const undo=()=>{
    if(!past.length)return;
    setFuture(old=>[patch,...old].slice(0,30));
    setPatch(past[past.length-1]);setPast(old=>old.slice(0,-1));
  };
  const redo=()=>{
    if(!future.length)return;
    setPast(old=>[...old,patch].slice(-30));
    setPatch(future[0]);setFuture(old=>old.slice(1));
  };
  const pageLabel=(pageId:string)=>{
    const page=document.pages.find(item=>item.id===pageId);if(!page)return "";
    const names:Record<string,{ru:string;ky:string}>={
      cover:{ru:"Обложка",ky:"Мукаба"},letter:{ru:"Приглашение",ky:"Чакыруу"},
      details:{ru:"Дата и место",ky:"Күнү жана жери"},program:{ru:"Программа",ky:"Программа"},
      memories:{ru:"Галерея",ky:"Галерея"},rsvpPage:{ru:"RSVP",ky:"RSVP"},
    };
    return names[page.id]?.[locale]??(page.name.includes("/")?page.name.split("/").slice(1).join("/").trim():page.name);
  };
  const sectionOrder=patch.sections?.order??source.pages.map(page=>page.id);
  const hiddenSections=patch.sections?.hidden??[];
  const canHide=(id:string)=>Boolean(contract.sectionEditing?.hideablePageIds.includes(id));
  const canMove=(id:string)=>Boolean(contract.sectionEditing?.reorderablePageIds.includes(id));
  const saveSections=(order:string[],hidden:string[])=>{
    const candidate:PersonalizationPatch={...patch,sections:{order,hidden}};
    try{
      personalizeDocument(source,contract,candidate,customerAssets,true);
      const currentId=visiblePages[activePageIndex]?.id;
      const visibleNext=order.filter(id=>!hidden.includes(id));
      setActiveMobilePage(Math.max(0,visibleNext.indexOf(currentId??"")));
      commitPatch(candidate);setWarning("");
    }catch(error){setWarning(error instanceof Error?error.message:"Invalid sections");}
  };
  const toggleSection=(id:string)=>{
    if(!canHide(id))return;
    saveSections([...sectionOrder],hiddenSections.includes(id)?
      hiddenSections.filter(key=>key!==id):[...hiddenSections,id]);
  };
  const moveSection=(id:string,direction:-1|1)=>{
    if(!canMove(id))return;
    const current=sectionOrder.indexOf(id);
    let target=current+direction;
    while(target>=0&&target<sectionOrder.length&&!canMove(sectionOrder[target]))target+=direction;
    if(target<0||target>=sectionOrder.length)return;
    const order=[...sectionOrder];
    [order[current],order[target]]=[order[target],order[current]];
    saveSections(order,[...hiddenSections]);
  };
  const openTool=(tool:"text"|"photo"|"style"|"music",button?:HTMLButtonElement)=>{
    mobileTriggerRef.current=button??null;
    setMobileTool(tool);setMobileSectionsOpen(false);openMobileStep(tool==="text"?"main":"appearance");
  };
  const openMobileStep=(next:Step,fieldId:string|null=null)=>{
    setStep(next);setSelectedFieldId(fieldId);setMode("edit");setMobileSheetOpen(true);
    mobileFormRef.current?.scrollTo({top:0,behavior:"auto"});
  };
  const closeMobileSheet=()=>{setMobileSheetOpen(false);setSelectedFieldId(null);window.requestAnimationFrame(()=>mobileTriggerRef.current?.focus());};
  useEffect(()=>{
    if(!mobileSheetOpen&&!mobileSectionsOpen)return;
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMobileSheetOpen(false);setMobileSectionsOpen(false);setSelectedFieldId(null);mobileTriggerRef.current?.focus();}};
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[mobileSheetOpen,mobileSectionsOpen]);
  const selectCanvasField=(event:MouseEvent<HTMLDivElement>)=>{
    if(!window.matchMedia("(max-width: 850px)").matches)return;
    const target=event.target;
    if(!(target instanceof Element))return;
    const root=event.currentTarget;
    let el:Element|null=target;
    while(el&&root.contains(el)){
      const nodeId=el.getAttribute("data-studio-node");
      if(nodeId){
        const field=editableFieldForNode(document,contract.fields,nodeId);
        if(field){
          event.preventDefault();event.stopPropagation();
          mobileTriggerRef.current=null;
          setMobileTool(field.kind==="image"||field.kind==="gallery"?"photo":field.kind==="theme"?"style":field.kind==="music"?"music":"text");
          openMobileStep(sectionToStep[field.section],field.id);
          return;
        }
      }
      el=el.parentElement;
    }
  };
  const update=(id:string,value:PersonalizedValue)=>{
    const candidate={...patch,values:{...patch.values,[id]:value}};
    try{personalizeDocument(source,contract,candidate,customerAssets,true);commitPatch(candidate);setWarning("");setReview(false);}
    catch(error){setWarning(error instanceof Error?error.message:"Invalid value");}
  };
  const changeLocale=(lang:"ru"|"ky")=>{
    try {
      const candidate={...patch,locale:lang};
      personalizeDocument(source,contract,candidate,customerAssets,true);
      commitPatch(candidate);setWarning("");
    }catch(error){setWarning(error instanceof Error?error.message:"Invalid locale");}
  };
  const reset=()=>{
    if(!window.confirm(t.resetConfirm))return;
    setPast([]);setFuture([]);setPatch(initialPatch(source,contract));setCustomerAssets([]);setCustomerUrls({});setReview(false);setWarning("");setStep("main");setMode("edit");setSelectedFieldId(null);
  };
  const forward=()=>{
    if(step!=="publish"){
      setStep(steps[currentIndex+1]);setSelectedFieldId(null);setMode("edit");if(!mobileSheetOpen)window.scrollTo({top:0,behavior:"auto"});
      return;
    }
    setReview(true);
    try{finalizePersonalization(source,contract,patch,customerAssets,true);setWarning("");}
    catch{setWarning(t.required);}
  };
  const fieldError=new Set(issues.map(issue=>issue.fieldId));
  const hasFields=contract.fields.length>0;
  const jumpPreview=(pageId:string)=>{
    const pageIndex=visiblePages.findIndex(page=>page.id===pageId);
    if(pageIndex<0)return;
    setActiveMobilePage(pageIndex);
    setMobileSectionsOpen(false);setMode("preview");
    window.requestAnimationFrame(()=>{
      const section=Array.from(mobileCanvasRef.current?.querySelectorAll<HTMLElement>("[data-preview-page]")??[])
        .find(node=>node.dataset.previewPage===pageId);
      section?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
    });
  };
  useEffect(()=>{
    const root=mobileCanvasRef.current;
    if(!root)return;
    for(const node of root.querySelectorAll<HTMLElement>("[data-studio-node]")){
      const f=editableFieldForNode(document,contract.fields,node.dataset.studioNode??"");
      node.classList.toggle("ce-mobile-editable-node",Boolean(f));
      node.classList.toggle("ce-mobile-selected-node",!!selectedFieldId&&f?.id===selectedFieldId);
    }
  },[document,contract,selectedFieldId,activeMobilePage,mobileSheetOpen]);
  const preview=<StudioV2ProjectRenderer
    key={previewRun} document={document} mediaUrls={mergedUrls}
    device="mobile" pageFilter={isMobileViewport?visiblePages[activePageIndex]?.id:undefined}
    guest={{mode:"preview"}}/>;

  return <main className={"ce-shell"+(mobileSheetOpen?" ce-mobile-sheet-open":"")}>
    <div className="ce-mobile-topbar">
      <Link href={`/${locale}/catalog/${slug}`} aria-label={t.back}><ArrowLeft size={19}/></Link>
      <strong>Eventiq<span>.</span></strong>
      <div className="ce-mobile-top-actions">
        <button type="button" aria-label={t.mobileUndo} disabled={!past.length} onClick={undo}><RotateCcw size={19}/></button>
        <button type="button" aria-label={t.mobileRedo} disabled={!future.length} onClick={redo}><RotateCw size={19}/></button>
        <span className="ce-mobile-cloud-status" role="status" aria-label={hydrated?status||t.mobileSaved:t.mobileSaving} title={hydrated?status||t.mobileSaved:t.mobileSaving}><Cloud size={19}/></span>
        <button className="ce-mobile-publish-top" type="button" onClick={e=>{mobileTriggerRef.current=e.currentTarget;setMobileSectionsOpen(false);openMobileStep("publish");}}>{t.publishAction}</button>
      </div>
    </div>
    <header className="ce-header">
      <Link aria-label={t.back} href={`/${locale}/catalog/${slug}`} className="ce-icon"><ArrowLeft size={20}/></Link>
      <Link href={`/${locale}`} className="ce-logo">eventiq<span>.</span></Link>
      <Link className="ce-account-link" href={`/${locale}/invitations`}>{locale==="ru"?"Мои приглашения":"Менин чакырууларым"}</Link>
      <div className="ce-save-state" role="status"><Save size={14}/><span>{hydrated?status||t.saveLocal:t.notSaved}</span></div>
    </header>
    <div className="ce-layout">
      <section className="ce-controls" aria-label={t.title}>
        <div className="ce-mobile-sheet-handle"><span className="ce-mobile-grabber" aria-hidden="true"/><span>{selectedFieldId?t.mobileSelection:step==="publish"?t.mobileCheck:t[step]}</span><button type="button" aria-label={t.mobileClose} onClick={closeMobileSheet}><X size={20}/></button></div>
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
        <div ref={mobileFormRef} className={mode==="preview"?"ce-form ce-mobile-hidden":"ce-form"}>
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
            displayedFields.length?displayedFields.map(field=>
              <div className={review&&fieldError.has(field.id)?"ce-field-invalid":""} key={field.id}>
                <SimpleField field={field} value={readPersonalizedValue(document,field)}
                  document={document} locale={locale} locales={contract.locales}
                  urls={mergedUrls} onChange={value=>update(field.id,value)}/>
              </div>):
              <p className="ce-empty">{isMobileViewport&&step==="appearance"&&mobileTool==="style"?t.mobileStyleHint+" "+t.mobileLocked:
                isMobileViewport&&step==="appearance"&&mobileTool==="music"?t.mobileNoMusic:hasFields?t.noFields:t.unsupported}</p>}
          <div className={step==="publish"||step==="appearance"&&(!isMobileViewport||mobileTool==="photo")?"ce-cloud-mount":"ce-cloud-mount ce-cloud-mount-hidden"}>
            <CustomerCloudControls
            locale={locale} templateVersionId={versionId} preferredDraftId={preferredDraftId} patch={patch}
            publishMode={step==="publish"} canPublish={issues.length===0}
            uploadTargets={uploadTargets}
            preferredUploadTargetId={selectedFieldId??undefined}
            onLoad={(remote,assets,urls)=>{
              try{
                personalizeDocument(source,contract,remote,assets,true);
                setCustomerAssets(assets);setCustomerUrls(urls);setPast([]);setFuture([]);setPatch(remote);
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
                commitPatch(nextPatch);setWarning("");
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
          <button type="button" className="ce-primary" onClick={isMobileViewport&&selectedFieldId?closeMobileSheet:forward}>
            {isMobileViewport&&selectedFieldId?t.mobileDone:step==="publish"?t.review:t.next}<ArrowRight size={17}/>
          </button>
        </footer>
      </section>
      <aside className={mode==="edit"?"ce-preview ce-mobile-hidden":"ce-preview"} aria-label={t.preview}>
        <div className="ce-preview-head">
          <div><strong>{t.preview}</strong><small>{name}</small></div>
          <button className="ce-secondary" aria-label={locale==="ru"?"Перезапустить анимации":"Анимацияны кайра баштоо"} type="button" onClick={()=>setPreviewRun(n=>n+1)}><RotateCcw size={15}/></button>
        </div>
        <nav className="ce-preview-sections" aria-label={t.sections}>
          {source.pages.map((page,index)=><button key={page.id} type="button" aria-current={index===activeMobilePage?"page":undefined} onClick={()=>jumpPreview(page.id)}
            title={page.name}>{String(index+1).padStart(2,"0")} <span>{page.name.includes("/") ? page.name.split("/").slice(1).join("/").trim() : page.name}</span></button>)}
        </nav>
        <div ref={mobileCanvasRef} className="ce-preview-screen" onClickCapture={selectCanvasField}>{preview}</div>
        <div className="ce-mobile-canvas-caption"><span>{t.mobileHint}</span></div>
        <nav className="ce-mobile-page-nav" aria-label={t.mobilePage}>
          <button type="button" disabled={activePageIndex===0} onClick={()=>jumpPreview(visiblePages[activePageIndex-1].id)} aria-label={t.back}><ArrowLeft size={18}/></button>
          <button type="button" onClick={e=>{mobileTriggerRef.current=e.currentTarget;setMobileSectionsOpen(true);setMobileSheetOpen(false);}}>{activePageIndex+1} / {visiblePages.length} <strong>{pageLabel(visiblePages[activePageIndex]?.id??"")}</strong><ChevronDown size={16}/></button>
          <button type="button" disabled={activePageIndex>=visiblePages.length-1} onClick={()=>jumpPreview(visiblePages[activePageIndex+1].id)} aria-label={t.next}><ArrowRight size={18}/></button>
        </nav>
        <nav className="ce-mobile-dock" aria-label={t.mobileEdit}>
          <button type="button" aria-pressed={mobileSheetOpen&&mobileTool==="text"} onClick={e=>openTool("text",e.currentTarget)}><Type size={22}/><span>{t.toolText}</span></button>
          <button type="button" aria-pressed={mobileSheetOpen&&mobileTool==="photo"} onClick={e=>openTool("photo",e.currentTarget)}><ImageIcon size={22}/><span>{t.toolPhotos}</span></button>
          <button type="button" aria-pressed={mobileSheetOpen&&mobileTool==="style"} onClick={e=>openTool("style",e.currentTarget)}><Palette size={22}/><span>{t.toolStyle}</span></button>
          <button type="button" aria-pressed={mobileSectionsOpen} onClick={e=>{mobileTriggerRef.current=e.currentTarget;setMobileSheetOpen(false);setMobileSectionsOpen(true);}}><Layers size={22}/><span>{t.sections}</span></button>
          <button type="button" aria-pressed={mobileSheetOpen&&mobileTool==="music"} onClick={e=>openTool("music",e.currentTarget)}><Music2 size={22}/><span>{t.toolMusic}</span></button>
        </nav>
      </aside>
    </div>
    {mobileSheetOpen&&<button type="button" className="ce-mobile-backdrop" onClick={closeMobileSheet} aria-label={t.mobileClose}/>}
    {mobileSectionsOpen&&<section className="ce-mobile-sections-screen" aria-label={t.mobileSectionsTitle}>
      <header>
        <button type="button" aria-label={t.back} onClick={()=>{setMobileSectionsOpen(false);mobileTriggerRef.current?.focus();}}><ArrowLeft size={21}/></button>
        <h2>{t.mobileSectionsTitle}</h2>
        <button type="button" className="ce-mobile-section-add" disabled={!hiddenSections.length} title={hiddenSections.length?t.sections:t.mobileLocked}
          aria-label={locale==="ru"?"Показать скрытую секцию":"Жашырылган бөлүмдү көрсөтүү"}
          onClick={()=>{const id=hiddenSections[0];if(id)toggleSection(id);}}><Plus size={20}/></button>
      </header>
      <div className="ce-mobile-sections-list">
        {document.pages.map((page,index)=>{
          const root=document.nodes[page.rootNodeId];
          const firstImage=root?.type==="frame"?root.children.map(id=>document.nodes[id]).find(node=>node?.type==="image"):undefined;
          const photo=firstImage?.type==="image"?document.assets[firstImage.assetId]:undefined;
          const url=photo?.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+photo.storageKey:photo?mergedUrls[photo.storageKey]:undefined;
          const hidden=root?.visible===false;
          const canReorder=canMove(page.id);
          const firstMovable=document.pages.findIndex(item=>canMove(item.id));
          const lastMovable=document.pages.findLastIndex(item=>canMove(item.id));
          return <div className={"ce-mobile-section-card"+(visiblePages[activePageIndex]?.id===page.id?" active":"")+(hidden?" is-hidden":"")} key={page.id}>
            <button type="button" className="ce-mobile-section-select" onClick={()=>hidden&&canHide(page.id)?toggleSection(page.id):jumpPreview(page.id)}>
              <span className="ce-mobile-section-thumbnail">{url?<img src={url} alt="" loading="lazy"/>:<Layers size={21}/>}</span>
              <span className="ce-mobile-section-title"><small>{String(index+1).padStart(2,"0")}</small>{pageLabel(page.id)}</span>
            </button>
            <button type="button" className="ce-mobile-section-eye"
              aria-label={(hidden?(locale==="ru"?"Показать":"Көрсөтүү"):canHide(page.id)?(locale==="ru"?"Скрыть":"Жашыруу"):t.mobileViewPage)+": "+pageLabel(page.id)}
              aria-pressed={!hidden}
              onClick={()=>canHide(page.id)?toggleSection(page.id):jumpPreview(page.id)}>
              {hidden?<EyeOff size={20}/>:<Eye size={20}/>}
            </button>
            <div className="ce-mobile-section-reorder">
              <button type="button" disabled={!canReorder||index<=firstMovable} onClick={()=>moveSection(page.id,-1)} aria-label={(locale==="ru"?"Выше":"Жогору")+": "+pageLabel(page.id)}><ArrowUp size={15}/></button>
              <button type="button" disabled={!canReorder||index>=lastMovable} onClick={()=>moveSection(page.id,1)} aria-label={(locale==="ru"?"Ниже":"Төмөн")+": "+pageLabel(page.id)}><ArrowDown size={15}/></button>
            </div>
          </div>;
        })}
        <p className="ce-mobile-sections-help"><LockKeyhole size={16}/>{t.mobileSectionsHint}</p>
      </div>
    </section>}
  </main>;
}
