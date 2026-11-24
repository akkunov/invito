import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import {basename, resolve, join} from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";
import {validatedTemplateVersion} from "../server/domain/persistence-contract.ts";
import {recipes, collectionDate} from "../templates/collection/recipes.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const handoff = join(root, "tamplates_codex/eventiq-10-templates-codex");
const index = JSON.parse(await readFile(join(handoff, "templates-index.json"), "utf8"));
const labels = {
  cover:["Приглашение","Чакыруу"], story:["Наша история","Биздин тарых"], details:["День свадьбы","Той күнү"],
  invitation:["Приглашение и программа","Чакыруу жана программа"], gallery:["Галерея и место","Сүрөттөр жана той өтүүчү жер"],
  event:["Событие","Иш-чара"], exhibition:["Галерея","Сүрөт галереясы"], ticket:["Билет","Билет"], envelope:["Конверт","Конверт"],
  plan:["Программа","Программа"], venue:["Место проведения","Той өтүүчү жер"], rsvp:["Подтверждение участия","Катышууну ырастоо"],
};
const locale = ([ru, ky]) => ({ru, ky});
const rect = ({x, y, width, height, w, h}) => ({x, y, width:width??w, height:height??h});
const style = (fontFamily, fontSize, fontWeight, color) => ({
  fontFamily,fontSize,fontWeight,color,italic:false,underline:false,strike:false,
});
const corners = radius => ({corners:{topLeft:radius,topRight:radius,bottomLeft:radius,bottomRight:radius}});
const empty = {ru:"",ky:""};
const schedule = [
 ["16:00", "Сбор гостей\nПриветственные напитки", "Конокторду тосуу\nСуусундуктар"],
 ["17:00", "Церемония\nТоржественная регистрация", "Нике салтанаты\nНикени каттоо"],
 ["18:30", "Праздничный ужин", "Майрамдык кечки тамак"],
 ["22:00", "Музыка и танцы", "Музыка жана бий"],
].map(([time,ru,ky]) => ({time,label:{ru,ky}}));

async function compile(entry, recipe) {
 const reference = join(handoff, "design/references", entry.slug);
 const geometry = JSON.parse(await readFile(join(handoff, entry.geometry), "utf8"));
 const definitions = geometry.pages ?? geometry.artboards;
 const tokens = {...geometry.tokens,...recipe.tokens};
 const doc = {schemaVersion:2,presentation:"collection",id:entry.slug,revision:0,locale:"ru",pages:[],nodes:{},assets:{},variables:{},values:{}};
 const personalization = {version:1,locales:["ru","ky"],fields:[]};
 function field(id, title, section, definition, required=false) {
   personalization.fields.push({id,label:locale(title),section,required,...definition});
 }
 function variable(key, type, value, label) {
   if (doc.variables[key]) return;
   doc.variables[key] = {type,label:locale(label)};
   doc.values[key] = {type,value};
 }
 variable("ceremonyDate","date",collectionDate,["Дата и время свадьбы","Тойдун күнү жана убактысы"]);
 field("ceremonyDate",["Дата и время свадьбы","Тойдун күнү жана убактысы"],"date",{kind:"date",key:"ceremonyDate"},true);

 const assetsDir = join(root, "public/images/collection", entry.slug);
 await mkdir(assetsDir,{recursive:true});
 const loaded = new Map();
 const files = new Map();
 async function asset(id, spec) {
   if (loaded.has(id)) return loaded.get(id);
   const path = spec.artboard ? join(reference,spec.artboard) : spec.prototype
     ? join(handoff,"prototype/assets",spec.prototype) : join(reference,spec.source);
   let pipeline = sharp(path);
   if (spec.crop) {
     const [left,top,width,height] = spec.crop;
     pipeline = pipeline.extract({left,top,width,height});
   }
   const {data, info} = await pipeline.webp({quality:91}).toBuffer({resolveWithObject:true});
   const file = id + ".webp";
   files.set(join(assetsDir,file),data);
   const item = {id,name:spec.label?.[0]??basename(path),storageKey:"/images/collection/"+entry.slug+"/"+file,
     mimeType:"image/webp",pixelWidth:info.width,pixelHeight:info.height,sizeBytes:data.length,...(spec.decorative?{decorative:true}:{})};
   doc.assets[id]=item;
   loaded.set(id,item);
   return item;
 }
 for(const [pageIndex,definition] of definitions.entries()){
   const original = definition.elements??definition.nodes??definition.layers;
   const pageRecipe = recipe.pages[definition.id];
   if(!pageRecipe) throw new Error("Missing page recipe "+entry.slug+" "+definition.id);
   const {width,height}=definition;
   const rootId=definition.id+"Root";
   const pageLabels=labels[definition.id==="rsvpPage"?"rsvp":definition.id]??labels.event;
   const rootNode={id:rootId,type:"frame",name:pageLabels[0],parentId:null,x:0,y:0,width,height,rotation:0,opacity:1,visible:true,locked:true,
    padding:{top:0,bottom:0,left:0,right:0},gap:0,layout:"free",background:pageRecipe.background??tokens.paper,clip:true,children:[]};
   doc.nodes[rootId]=rootNode;
   doc.pages.push({id:definition.id,rootNodeId:rootId,name:pageLabels[0],placement:{x:pageIndex*(width+30),y:0},
    responsive:{mobile:{width,height,mode:"scale"}}});
   for(const op of pageRecipe.layers){
     const placement=op.box??original.find(item=>item.id===op.at);
     if(!placement)throw new Error("Unknown geometry node "+entry.slug+"/"+definition.id+"/"+op.at);
     const id=definition.id+"_"+(op.id??op.at);
     if(doc.nodes[id])throw new Error("Duplicate layer "+id);
     const base={id,parentId:rootId,...rect(placement),rotation:op.rotation??0,opacity:op.opacity??1,visible:true,locked:true,
       ...(op.radius?{visual:corners(op.radius)}:{})};
     const ink=op.color??pageRecipe.ink??tokens.ink;
     const accent=op.accent??pageRecipe.accent??tokens.accent??tokens.wine??ink;
     let node;
     if(op.type==="shape"){
       node={...base,type:"shape",shape:op.shape??"rectangle",fill:op.fill??accent,stroke:op.stroke??null,strokeWidth:op.stroke?1:0};
       if(op.clip)node.visual={...node.visual,clipPolygon:op.clip};
       if(op.gradient)node.visual={...node.visual,fill:{kind:"linear",angle:op.gradient.angle,stops:op.gradient.stops}};
     }else if(op.type==="text"){
       const key=op.dateFormat?"ceremonyDate":op.key??id;
       const title=op.label??op.copy;
       if(!op.dateFormat){
        variable(key,"text",locale(op.copy),op.label??["Текст "+op.at,"Текст "+op.at]);
        if(op.label&&!personalization.fields.some(f=>f.key===key))field(key,title,op.section??"main",{kind:"text",key,maxLength:500,multiline:true},true);
       }
       const size=op.size??18;
       node={...base,type:"text",bindingKey:key,runs:[{text:op.copy?.[0]??"",style:style(op.family??"sans",size,op.weight??500,ink)}],
        textAlign:op.align??"left",letterSpacing:op.spacing??0,lineHeight:op.line??1.12,autoHeight:op.grow??true,...(op.dateFormat?{dateFormat:op.dateFormat}:{})};
     }else if(op.type==="image"){
       const media=await asset(op.asset??id,op.media);
       node={...base,type:"image",assetId:media.id,fit:"cover",focalX:op.focal?.[0]??.5,focalY:op.focal?.[1]??.5};
       if(op.mask)node.visual={...node.visual,mask:op.mask};
       if(op.clip)node.visual={...node.visual,clipPolygon:op.clip};
       if(op.media.label&&!op.media.decorative)field(id,op.media.label,"photos",{kind:"image",nodeId:id,minWidth:1,minHeight:1});
     }else if(op.type==="widget"){
       let block={kind:op.kind,title:empty,...op.block};
       if(op.kind==="rsvp"){
        block={...block,maxGuests:4,deadline:null};
        field(id,["Подтверждение участия","Катышууну ырастоо"],"rsvp",{kind:"rsvp",nodeId:id,maxGuests:10});
       }else if(op.kind==="schedule"){
        block={...block,layout:block.layout??"rows",items:schedule};
        field(id,["Программа дня","Тойдун программасы"],"schedule",{kind:"schedule",nodeId:id,maxItems:20},true);
       }else if(op.kind==="location"){
        const addressKey="venueAddress";
        const address=locale(op.address??["Бишкек, Кыргызстан","Бишкек, Кыргызстан"]);
        if(!doc.variables[addressKey]) {
         variable(addressKey,"text",address,["Адрес","Дарек"]);
         field(addressKey,["Адрес","Дарек"],"location",{kind:"text",key:addressKey,maxLength:300,multiline:false},true);
        }
        block={...block,address,addressKey};
       }else if(op.kind==="gallery"){
        block={...block,assetIds:await Promise.all(op.images.map(async (media,i)=>(await asset(id+"_"+(i+1),media)).id))};
        field(id,["Фотогалерея","Сүрөт галереясы"],"photos",{kind:"gallery",nodeId:id,maxPhotos:4});
       }else if(op.kind==="music"){
        block={...block,source:""};
        field(id,["Музыка","Музыка"],"music",{kind:"music",nodeId:id,sources:[]});
       }else if(op.kind==="calendar"||op.kind==="countdown"){
        block={...block,target:collectionDate,targetKey:"ceremonyDate"};
       }
       node={...base,height:["sectionLink","calendar","location"].includes(op.kind)?Math.max(48,base.height):base.height,type:"widget",block,appearance:{fontFamily:"sans",fontSize:16,color:ink,background:"transparent",accent,...(op.buttonInk??pageRecipe.buttonInk?{buttonColor:op.buttonInk??pageRecipe.buttonInk}:{})}};
     }else throw new Error("Unrecognized layer "+id);
     doc.nodes[id]=node;
     rootNode.children.push(id);
   }
 }
 doc.assets = Object.fromEntries(Object.entries(doc.assets).sort(([left],[right])=>left.localeCompare(right,"en")));
 const pack={format:"eventiq-template",version:1,manifest:{slug:entry.slug,name:entry.name,description:recipe.description,
  category:"WEDDING",tags:["wedding","collection","ru","ky"],coverPageId:doc.pages[0].id},document:doc,personalization};
 validatedTemplateVersion(doc,personalization);
 files.set(join(root,"templates/packages",entry.slug+".v1.json"),JSON.stringify(pack,null,2)+"\n");
 return {files, paths:Object.values(doc.assets).map(item=>item.storageKey)};
}

const requested = process.argv.slice(2);
const slugs = requested.length ? requested : Object.keys(recipes);
const paths = [];
const drafts = [];
for(const slug of slugs) {
 const entry=index.find(item=>item.slug===slug);
 const recipe=recipes[slug];
 if(!entry||!recipe)throw new Error("Unknown or unimplemented template: "+slug);
 const draft = await compile(entry,recipe);
 paths.push(...draft.paths);
 drafts.push({slug,...draft});
}
const registry = resolve(root,"server/src/modules/documents/collection-static-assets.ts");
const existing = await readFile(registry,"utf8").catch(error=>{if(error.code==="ENOENT")return "";throw error;});
const unchanged = [...existing.matchAll(/"(\/images\/collection\/([^/]+)\/[^"]+)"/g)]
 .filter(match=>!slugs.includes(match[2])).map(match=>match[1]);
async function replaceFile(path, content) {
 const temporary = path + ".tmp-" + process.pid;
 await writeFile(temporary,content);
 await rename(temporary,path);
}
for(const {slug,files} of drafts) {
 for(const [path,data] of files)await replaceFile(path,data);
 console.log("Compiled "+slug);
}
await replaceFile(registry,"// Generated by scripts/compile-template-collection.mjs.\nexport const collectionStaticAssets = "+JSON.stringify([...unchanged,...paths].sort(),null,2)+" as const;\n");
