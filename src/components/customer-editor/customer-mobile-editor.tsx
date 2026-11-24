"use client";

import Link from "next/link";
import {useEffect,useMemo,useRef,useState,type MouseEvent} from "react";
import {ArrowLeft,ArrowRight,Check,Eye,Pencil,RotateCcw,RotateCw,Save,X,Type,Image as ImageIcon,Layers,Palette,Music2,Cloud,ChevronDown,LockKeyhole,EyeOff,ArrowUp,ArrowDown,Plus} from "lucide-react";
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
import {isHeritagePresentation} from "@/features/studio-v2/core/heritage-layout.ts";
import {galleryAfterUpload} from "@/features/invitations/photo-geometry";
import {customerApi,type VerifiedCustomerAsset} from "@/features/invitations/customer-cloud";
import {editableFieldForNode} from "@/features/invitations/mobile-editor-selection";
import {UniversalMobileEditor} from "./universal-mobile-editor";
import {UniversalSectionManager} from "./universal-section-manager";

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
function assetsForPatch(patch:PersonalizationPatch,assets:readonly VerifiedCustomerAsset[]){
  const ids=new Set<string>();
  for(const value of Object.values(patch.values)){
    if(value.kind==="image")ids.add(value.assetId);
    else if(value.kind==="gallery")for(const id of value.assetIds)ids.add(id);
  }
  return assets.filter(asset=>ids.has(asset.id));
}

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
  const [selectedNodeId,setSelectedNodeId]=useState<string|null>(null);
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
        personalizeDocument(source,contract,parsed,assetsForPatch(parsed,parsedAssets),true);
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
      if(Object.keys(patch.values).length || patch.locale || patch.sections){
        window.localStorage.setItem(cacheKey,JSON.stringify(patch));
        window.localStorage.setItem(cacheKey+":assets",JSON.stringify(assetsForPatch(patch,customerAssets)));
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
        const entries=await Promise.allSettled(customerAssets.map(async asset=>{
          const id=asset.storageKey.slice("asset:".length);
          const data=await customerApi<{url:string;expiresInSeconds:number}>(
            "/customer/media/"+encodeURIComponent(id)+"/read-url");
          const url=new URL(data.url);
          if(url.protocol!=="https:"||!url.hostname.endsWith(".r2.cloudflarestorage.com"))throw Error("INVALID_URL");
          return [asset.storageKey,data.url] as const;
        }));
        if(active)setCustomerUrls(old=>({...old,...Object.fromEntries(entries.flatMap(entry=>entry.status==="fulfilled"?[entry.value]:[]))}));
      }catch{}
    };
    void refresh();
    const timer=window.setInterval(()=>void refresh(),45_000);
    return()=>{active=false;window.clearInterval(timer);};
  },[customerAssets]);

  const document=useMemo(()=>personalizeDocument(source,contract,patch,assetsForPatch(patch,customerAssets),true),[source,contract,patch,customerAssets]);
  const mergedUrls=useMemo(()=>({...templateUrls,...customerUrls}),[templateUrls,customerUrls]);
  const visiblePages=useMemo(()=>document.pages.filter(page=>document.nodes[page.rootNodeId]?.visible!==false),[document]);
  const activePageIndex=Math.min(activeMobilePage,Math.max(0,visiblePages.length-1));
  const issues=useMemo(()=>personalizationIssues(document,contract),[document,contract]);
  const grouped=useMemo(()=>contract.fields.reduce<Record<Step,EditableField[]>>((acc,field)=>{
    acc[sectionToStep[field.section]].push(field);
    return acc;
  },{main:[],event:[],appearance:[],publish:[]}),[contract]);
  const uploadTargets=useMemo(()=>grouped.appearance.reduce<
    Array<{id:string;label:string;kind:"image"|"gallery";minWidth:number;minHeight:number;maxPhotos?:number;currentCount?:number}>
  >((targets,field)=>{
    if(field.kind==="image")targets.push({id:field.id,label:field.label[locale],kind:"image",
      minWidth:field.minWidth,minHeight:field.minHeight});
    else if(field.kind==="gallery"){
      const value=readPersonalizedValue(document,field);
      targets.push({id:field.id,label:field.label[locale],kind:"gallery",
        minWidth:1,minHeight:1,maxPhotos:field.maxPhotos,
        currentCount:value?.kind==="gallery"?value.assetIds.length:0});
    }
    return targets;
  },[]),[grouped,locale,document]);
  const currentIndex=steps.indexOf(step);
  const filledCount=contract.fields.length-issues.length;
  const completion=contract.fields.length?Math.max(0,Math.round(filledCount/contract.fields.length*100)):100;
  const fields=grouped[step];
  const displayedFields=selectedFieldId?fields.filter(field=>field.id===selectedFieldId):
    isMobileViewport&&step==="appearance"?fields.filter(field=>mobileTool==="photo"
      ?field.kind==="image"||field.kind==="gallery"
      :mobileTool==="style"?field.kind==="theme"||field.kind==="textStyle":field.kind==="music"):fields;
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
      memories:{ru:"Галерея",ky:"Галерея"},invitation:{ru:"Приглашение и программа",ky:"Чакыруу жана тойдун программасы"},
      gallery:{ru:page.name,ky:isHeritagePresentation(document.presentation)?"Галерея жана той өтүүчү жер":"Галерея"},rsvpPage:{ru:"RSVP",ky:"RSVP"},
    };
    return patch.sections?.names?.[page.id]??names[page.id]?.[locale]??(page.name.includes("/")?page.name.split("/").slice(1).join("/").trim():page.name);
  };
  const sectionOrder=patch.sections?.order??source.pages.map(page=>page.id);
  const hiddenSections=patch.sections?.hidden??[];
  const canHide=(id:string)=>Boolean(contract.sectionEditing?.hideablePageIds.includes(id));
  const canMove=(id:string)=>Boolean(contract.sectionEditing?.reorderablePageIds.includes(id));
  const saveSections=(order:string[],hidden:string[])=>{
    const candidate:PersonalizationPatch={...patch,sections:{...patch.sections,order,hidden}};
    try{
      personalizeDocument(source,contract,candidate,assetsForPatch(candidate,customerAssets),true);
      const currentId=visiblePages[activePageIndex]?.id;
      const visibleNext=order.filter(id=>!hidden.includes(id));
      setActiveMobilePage(Math.max(0,visibleNext.indexOf(currentId??"")));
      commitPatch(candidate);setWarning("");
    }catch(error){setWarning(error instanceof Error?error.message:"Invalid sections");}
  };
  const renameSection=(id:string,name:string)=>{
    if(!contract.sectionEditing?.renameablePageIds?.includes(id))return;
    const candidate:PersonalizationPatch={...patch,sections:{order:[...sectionOrder],hidden:[...hiddenSections],names:{...patch.sections?.names,[id]:name}}};
    try{personalizeDocument(source,contract,candidate,assetsForPatch(candidate,customerAssets),true);commitPatch(candidate);setWarning("");}
    catch(error){setWarning(error instanceof Error?error.message:"Invalid section name");}
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
    setMobileTool(tool);setSelectedNodeId(null);setMobileSectionsOpen(false);openMobileStep(tool==="text"?"main":"appearance");
  };
  const openMobileStep=(next:Step,fieldId:string|null=null)=>{
    setStep(next);setSelectedFieldId(fieldId);setMode("edit");setMobileSheetOpen(true);
    mobileFormRef.current?.scrollTo({top:0,behavior:"auto"});
  };
  const closeMobileSheet=()=>{setMobileSheetOpen(false);setSelectedFieldId(null);setSelectedNodeId(null);window.requestAnimationFrame(()=>mobileTriggerRef.current?.focus());};
  useEffect(()=>{
    if(!mobileSheetOpen&&!mobileSectionsOpen)return;
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMobileSheetOpen(false);setMobileSectionsOpen(false);setSelectedFieldId(null);setSelectedNodeId(null);mobileTriggerRef.current?.focus();}};
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
          mobileTriggerRef.current=null;setSelectedNodeId(nodeId);
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
    try{personalizeDocument(source,contract,candidate,assetsForPatch(candidate,customerAssets),true);commitPatch(candidate);setWarning("");setReview(false);}
    catch(error){setWarning(error instanceof Error?error.message:"Invalid value");}
  };
  const changeLocale=(lang:"ru"|"ky")=>{
    try {
      const candidate={...patch,locale:lang};
      personalizeDocument(source,contract,candidate,assetsForPatch(candidate,customerAssets),true);
      commitPatch(candidate);setWarning("");
    }catch(error){setWarning(error instanceof Error?error.message:"Invalid locale");}
  };
  const reset=()=>{
    if(!window.confirm(t.resetConfirm))return;
    setPast([]);setFuture([]);setPatch(initialPatch(source,contract));setCustomerAssets([]);setCustomerUrls({});setReview(false);setWarning("");setStep("main");setMode("edit");setSelectedFieldId(null);setSelectedNodeId(null);
  };
  const forward=()=>{
    if(step!=="publish"){
      setStep(steps[currentIndex+1]);setSelectedFieldId(null);setMode("edit");if(!mobileSheetOpen)window.scrollTo({top:0,behavior:"auto"});
      return;
    }
    setReview(true);
    try{finalizePersonalization(source,contract,patch,assetsForPatch(patch,customerAssets),true);setWarning("");}
    catch{setWarning(t.required);}
  };
  const selectedContentField=selectedNodeId?editableFieldForNode(document,contract.fields,selectedNodeId):undefined;
  const selectedStyleField=selectedNodeId?contract.fields.find(field=>field.kind==="textStyle"&&field.nodeId===selectedNodeId):undefined;
  const renderedFields=isMobileViewport&&selectedContentField&&selectedStyleField&&selectedContentField.id!==selectedStyleField.id?[selectedContentField,selectedStyleField]:displayedFields;
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
      node.classList.toggle("ce-mobile-selected-node",!!selectedNodeId&&node.dataset.studioNode===selectedNodeId||!!selectedFieldId&&f?.id===selectedFieldId);
    }
  },[document,contract,selectedFieldId,selectedNodeId,activeMobilePage,mobileSheetOpen]);
  const preview=<StudioV2ProjectRenderer
    key={previewRun} document={document} mediaUrls={mergedUrls}
    device="mobile" pageFilter={isMobileViewport?visiblePages[activePageIndex]?.id:undefined}
    guest={{mode:"preview"}}/>;

  return <UniversalMobileEditor
    locale={locale} backHref={`/${locale}/catalog/${slug}`}
    sheetOpen={mobileSheetOpen} activeTool={mobileSectionsOpen?"sections":mobileSheetOpen?mobileTool:"text"}
    pageIndex={activePageIndex} pageCount={visiblePages.length} pageName={pageLabel(visiblePages[activePageIndex]?.id??"")}
    onNavigate={delta=>{const page=visiblePages[activePageIndex+delta];if(page)jumpPreview(page.id);}}
    onTool={(tool,trigger)=>{
      if(tool==="sections"){mobileTriggerRef.current=trigger;setMobileSheetOpen(false);setMobileSectionsOpen(true);}
      else openTool(tool,trigger);
    }}
    canUndo={past.length>0} canRedo={future.length>0} onUndo={undo} onRedo={redo}
    saveState={warning===t.storageError?"error":hydrated?"saved":"pending"} saveLabel={hydrated?status||t.saveLocal:t.notSaved}
    onPublish={trigger=>{mobileTriggerRef.current=trigger;setMobileSectionsOpen(false);openMobileStep("publish");}}
    canvas={preview} canvasRef={mobileCanvasRef} onCanvasClick={selectCanvasField}
    previewClassName={mode==="edit"?"ce-preview ce-mobile-hidden":"ce-preview"} onClose={closeMobileSheet}
    desktopHeader={<header className="ce-header">
      <Link aria-label={t.back} href={`/${locale}/catalog/${slug}`} className="ce-icon"><ArrowLeft size={20}/></Link>
      <Link href={`/${locale}`} className="ce-logo">eventiq<span>.</span></Link>
      <Link className="ce-account-link" href={`/${locale}/invitations`}>{locale==="ru"?"Мои приглашения":"Менин чакырууларым"}</Link>
      <div className="ce-save-state" role="status"><Save size={14}/><span>{hydrated?status||t.saveLocal:t.notSaved}</span></div>
    </header>}
    desktopPreviewHeader={<><div className="ce-preview-head">
          <div><strong>{t.preview}</strong><small>{name}</small></div>
          <button className="ce-secondary" aria-label={locale==="ru"?"Перезапустить анимации":"Анимацияны кайра баштоо"} type="button" onClick={()=>setPreviewRun(n=>n+1)}><RotateCcw size={15}/></button>
        </div>
        <nav className="ce-preview-sections" aria-label={t.sections}>
          {source.pages.map((page,index)=><button key={page.id} type="button" aria-current={index===activeMobilePage?"page":undefined} onClick={()=>jumpPreview(page.id)}
            title={page.name}>{String(index+1).padStart(2,"0")} <span>{page.name.includes("/") ? page.name.split("/").slice(1).join("/").trim() : page.name}</span></button>)}
        </nav></>}
    settings={<section className="ce-controls" aria-label={t.title}>
        <div className="ce-mobile-sheet-handle"><span className="ce-mobile-grabber" aria-hidden="true"/><span>{selectedFieldId?(selectedStyleField?t.toolText:t.mobileSelection):step==="publish"?t.mobileCheck:t[step]}</span><button type="button" aria-label={t.mobileClose} onClick={closeMobileSheet}><X size={20}/></button></div>
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
            renderedFields.length?renderedFields.map(field=>
              <div className={review&&fieldError.has(field.id)?"ce-field-invalid":""} key={field.id}>
                <SimpleField field={field} value={readPersonalizedValue(document,field)}
                  document={document} locale={locale} locales={isMobileViewport&&selectedNodeId&&step==="main"?[document.locale]:contract.locales}
                  urls={mergedUrls} musicLibrary={isMobileViewport} onChange={value=>update(field.id,value)}/>
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
            onUploaded={(fieldId,results,uploadMode)=>{
              const successful=results.filter((result):result is NonNullable<typeof result>=>result!==null);
              if(!successful.length)return;
              const nextAssets=[...customerAssets,...successful.map(result=>result.asset)];
              const field=contract.fields.find(f=>f.id===fieldId);
              if(!field||field.kind!=="image"&&field.kind!=="gallery")throw Error("INVALID_UPLOAD_TARGET");
              const current=readPersonalizedValue(document,field);
              const nextValue=field.kind==="gallery"?
                {kind:"gallery" as const,assetIds:galleryAfterUpload(current?.kind==="gallery"?current.assetIds:[],results.map(result=>result?.asset.id??null),field.maxPhotos,uploadMode)}:
                {kind:"image" as const,assetId:successful[0].asset.id};
              const nextPatch={...patch,values:{...patch.values,[fieldId]:nextValue}};
              personalizeDocument(source,contract,nextPatch,assetsForPatch(nextPatch,nextAssets),true);
              setCustomerAssets(nextAssets);setCustomerUrls(v=>({...v,...Object.fromEntries(successful.map(result=>[result.asset.storageKey,result.url]))}));
              commitPatch(nextPatch);setWarning("");
            }}
            />
          </div>
          <p className="ce-security-note">{t.original}</p>
          {warning&&<p className="ce-warning" role="alert">{warning}</p>}
        </div>
        <footer className={mode==="preview"?"ce-footer ce-mobile-hidden":"ce-footer"}>
          <button type="button" className="ce-secondary" onClick={isMobileViewport?closeMobileSheet:currentIndex?()=>{setStep(steps[currentIndex-1]);setMode("edit");}:reset}>
            {isMobileViewport?t.mobileClose:currentIndex?t.back:t.reset}
          </button>
          <button type="button" className="ce-primary" onClick={isMobileViewport&&selectedFieldId?closeMobileSheet:forward}>
            {isMobileViewport&&selectedFieldId?t.mobileDone:step==="publish"?t.review:t.next}<ArrowRight size={17}/>
          </button>
        </footer>
      </section>}
    overlay={mobileSectionsOpen&&<UniversalSectionManager
      locale={locale} activeId={visiblePages[activePageIndex]?.id}
      sections={document.pages.map((page,index)=>{
        const root=document.nodes[page.rootNodeId];
        const image=root?.type==="frame"?root.children.map(id=>document.nodes[id]).find(node=>node?.type==="image"):undefined;
        const asset=image?.type==="image"?document.assets[image.assetId]:undefined;
        const thumbnail=asset?.storageKey.startsWith("/images/")?(process.env.NEXT_PUBLIC_PAGES_BASE_PATH??"")+asset.storageKey:asset?mergedUrls[asset.storageKey]:undefined;
        return {id:page.id,name:pageLabel(page.id),thumbnail,visible:root?.visible!==false,canToggle:canHide(page.id),
          canMoveUp:canMove(page.id)&&index>document.pages.findIndex(item=>canMove(item.id)),
          canMoveDown:canMove(page.id)&&index<document.pages.findLastIndex(item=>canMove(item.id)),
          canRename:Boolean(contract.sectionEditing?.renameablePageIds?.includes(page.id))};
      })}
      onClose={()=>{setMobileSectionsOpen(false);mobileTriggerRef.current?.focus();}}
      onOpen={jumpPreview} onToggle={toggleSection} onMove={moveSection} onRename={renameSection}
      onAdd={hiddenSections.length?()=>toggleSection(hiddenSections[0]):undefined}/>}
  />;
}
