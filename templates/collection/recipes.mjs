export const collectionDate = "2027-05-29T17:00:00+06:00";
const box = (x,y,width,height) => ({x,y,width,height});
const page = (layers, options={}) => ({layers,...options});
const text = (at,copy,size,options={}) => ({type:"text",at,copy,size,...options});
const title = (at,copy,size,options={}) => text(at,copy,size,{family:"serif",weight:550,...options});
const field = (label,key,section) => ({label,key,section});
const date = (at,size,options={}) => text(at,null,size,{family:"serif",weight:600,dateFormat:"date",align:"center",...options});
const image = (at,media,options={}) => ({type:"image",at,media,...options});
const region = (artboard,crop,label) => ({artboard:artboard.toString().padStart(2,"0")+"-artboard.png",crop,label,decorative:!label});
const crop = (source,label,crop) => ({source:"photo-crops/"+source,label,crop,decorative:!label});
const original = (prototype,label) => ({prototype,label,decorative:!label});
const shape = (at,fill,options={}) => ({type:"shape",at,fill,...options});
const widget = (at,kind,block={},options={}) => ({type:"widget",at,kind,block,...options});
const action = (at,copy,style="outline",destination="next",options={}) => widget(at,"sectionLink",{title:{ru:copy[0],ky:copy[1]},style,destination},options);
const calendar = (at,layout="button",options={}) => widget(at,"calendar",{layout},options);
const map = (at,options={}) => widget(at,"location",{showAddress:false},options);
const form = (at,options={}) => widget(at,"rsvp",{layout:"inline",guestControl:"stepper",wish:true},options);
const music = (at,options={}) => widget(at,"music",{},options);
const storyNames = ["Алибек и Алина","Алибек жана Алина"];
const coupleLabel = ["Имена пары","Түгөйлөрдүн ысымдары"];
const photoLabel = ["Обложка","Мукаба"];
const venueLabel = ["Фотография площадки","Той өтүүчү жердин сүрөтү"];
const venueTitle = ["Название площадки","Той өтүүчү жердин аталышы"];
const inviteLabel = ["Текст приглашения","Чакыруу тексти"];
const reply = ["Подтвердите участие","Катышууңузду ырастаңыз"];
const next = ["К следующему разделу","Кийинки бөлүмгө"];
const venue = ["VILLA TOSCANA","VILLA TOSCANA"];
const chapterCopy = [
 ["12.06.2022","Первая встреча","Биринчи жолугушуу","Мы познакомились совершенно случайно, но сразу поняли, что это особенная встреча.","Күтүүсүз таанышып, бул өзгөчө жолугушуу экенин дароо түшүндүк."],
 ["18.08.2023","Первое путешествие","Биринчи саякат","Наше первое совместное путешествие научило нас быть ещё ближе.","Биринчи саякатыбыз бизди дагы жакындатты."],
 ["14.02.2026","Она сказала «Да»","Ал «ооба» деди","В этот день мы поняли — хотим провести вместе всю жизнь.","Ошол күнү өмүр бою бирге болууну чечтик."],
];
const photo = (ru,ky) => [ru,ky];
const portrait = photo("Портрет пары","Түгөйлөрдүн портрети");
const wine = "#791F35";

const loveStory = {
 description:"История пары в фотокарточках, билет на свадьбу и почтовый ответ гостя.",
 tokens:{accent:wine},
 pages:{
  cover:page([
   shape("coverSky","#B8CAD4"),
   image("coverBranches",region(1,[278,0,112,138]),{box:box(278,0,112,138)}),
   image("coverPhoto",original("cover.webp",photoLabel),{focal:[.5,.22]}),
   text("eyebrow",["ПРИГЛАШЕНИЕ\nНА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРУУ"],13,{weight:650,spacing:3}),
   shape("eyebrowRule",wine),
   title("names",["АЛИБЕК\nИ АЛИНА","АЛИБЕК\nЖАНА АЛИНА"],73,{...field(coupleLabel,"coupleNames"),spacing:-3,line:.98}),
   date("date",24,{align:"left",spacing:3,color:wine}),
   text("storyLink",["НАША ИСТОРИЯ","БИЗДИН ТАРЫХ"],12,{box:box(106,928,216,29),align:"center",spacing:3,color:"#302824"}),
   action("scrollIcon",next,"arrow"),
  ],{background:"#B8CAD4"}),
  story:page([
   shape("storyRule",wine),
   title("storyTitle",["НАША\nИСТОРИЯ","БИЗДИН\nТАРЫХ"],32,{spacing:3,line:1}),
   text("storySubtitle",["ТРИ ГЛАВЫ, КОТОРЫЕ\nПРИВЕЛИ НАС К ЭТОМУ ДНЮ","БИЗДИ УШУЛ КҮНГӨ\nАЛЫП КЕЛГЕН ҮЧ БАЯН"],11,{spacing:1.5,weight:650}),
   shape("storyLine",wine),
   ...["meeting","trip","proposal"].flatMap((id,i)=>{
    const [day,ru,ky,description,translation]=chapterCopy[i];
    return [
     shape(id+"Dot",wine,{box:box(26,[273,508,735][i],10,10),shape:"circle"}),
     title(id+"Date",[day,day],20,{...field([ru+" — дата",ky+" — күнү"],id+"Date"),color:wine}),
     text(id+"Title",[ru,ky],15,{...field([ru+" — заголовок",ky+" — аталышы"],id+"Title"),weight:680}),
     text(id+"Text",[description,translation],13,field([ru+" — описание",ky+" — баяны"],id+"Description")),
     shape(id+"Mat","#FFF9F1",{box:box([190,189,195][i],[221,468,705][i],[196,198,191][i],[237,233,209][i]),rotation:[-3,3,-3][i]}),
     image(id+"Photo",original(["first-meeting.webp","first-trip.webp","proposal.webp"][i],photo(ru+" — фото",ky+" — сүрөт")), {rotation:[-3,3,-3][i]}),
    ];
   }),
   image("landscapeFooter",original("landscape.webp")),
  ]),
  details:page([
   shape("ticketBacking",wine,{box:box(13,20,364,335),radius:16,rotation:-3}),
   shape("ticket","#FFF9F1",{radius:13,stroke:"#D0B3A1",rotation:-2}),
   text("ticketEyebrow",["ПРИГЛАШАЕМ ВАС\nНА НАШУ СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРАБЫЗ"],13,{...field(inviteLabel,"invitationText"),align:"center",spacing:2,weight:650}),
   date("ticketDate",37,{color:wine,spacing:-1}),
   shape("ticketLine","#A99B8D",{box:box(55,190,280,1)}),
   date("ticketDay",14,{dateFormat:"weekday"}),
   date("ticketTime",23,{dateFormat:"time",color:wine}),
   calendar("calendarAction"),
   title("dayHeading",["НАШ ДЕНЬ","ТОЙ КҮНҮ"],25,{align:"center",spacing:2}),
   widget("program","schedule"),
   image("venuePhoto",original("venue.webp",venueLabel),{radius:12}),
   title("venueName",venue,22,field(venueTitle,"venueName","location")),
   map("mapAction",{box:box(27,881,336,96),block:{},address:["г. Бишкек, ул. Курманжан Датки, 45","Бишкек ш., Курманжан Датка көч., 45"]}),
  ]),
  rsvpPage:page([
   image("airmailBorder",region(4,[1,2,387,37])),
   image("stamp",region(4,[277,39,91,87])),
   title("rsvpHeading",["ОТПРАВЬТЕ\nСВОЙ ОТВЕТ","ЖООБУҢУЗДУ\nЖӨНӨТҮҢҮЗ"],24,{spacing:1.4}),
   text("rsvpIntro",["Будем рады разделить этот особенный день вместе с вами.","Бул өзгөчө күндү сиздер менен бирге өткөрүүгө кубанычтабыз."],16,field(["Текст перед формой","Анкетанын алдындагы текст"],"rsvpIntro","rsvp")),
   form("rsvpWidget"),
   music("music"),
   image("closingPhoto",original("closing.webp",photo("Финальный снимок","Акыркы сүрөт")),{radius:9,rotation:-3}),
  ]),
 },
};

const decoration = (file) => ({source:"decoration-crops/"+file,decorative:true});
const centered = {align:"center"};
const label = (at,ru,ky,options={}) => text(at,[ru,ky],13,{weight:650,spacing:2,...options});
const sectionTitle = (at,ru,ky,size,options={}) => title(at,[ru,ky],size,{...centered,spacing:1.1,...options});
const names = (at,size,options={}) => title(at,["АЛИБЕК\nИ АЛИНА","АЛИБЕК\nЖАНА АЛИНА"],size,{...centered,
 ...field(coupleLabel,"coupleNames"),line:.94,spacing:-1.7,...options});
const invite = (at,size,options={}) => text(at,[
 "С радостью приглашаем вас разделить с нами особенный день — нашу свадьбу.",
 "Биздин өзгөчө күнүбүздү — үйлөнүү тоюбузду — бирге өткөрүүгө чакырабыз.",
],size,{...centered,...field(inviteLabel,"invitationText"),...options});
const guestIntro = (at,options={}) => text(at,[
 "Будем рады разделить этот особенный день вместе с вами.",
 "Бул өзгөчө күндү сиздер менен бирге өткөрүүгө кубанычтабыз.",
],16,{...centered,...field(["Вступление к анкете","Анкетага кириш сөз"],"rsvpIntro","rsvp"),...options});
const venueName = (at,options={}) => title(at,venue,23,{...field(venueTitle,"venueName","location"),...options});
const venueAddress = (at,options={}) => text(at,["г. Бишкек, Кыргызстан","Бишкек ш., Кыргызстан"],15,{
 ...field(["Адрес","Дарек"],"venueAddress","location"),...options,
});
const compactForm = (x,y,w,h,block={}) => form("response",{box:box(x,y,w,h),block:{layout:"inline",guestControl:"stepper",wish:true,...block}});
const outlineMap = (at,options={}) => map(at,options);
const inlineLocation = (at,options={}) => map(at,{...options,block:{showAddress:true,...options.block}});
const chapters = (photoPrefix,textPrefix,filenamePrefix,options={}) => chapterCopy.flatMap(([day,ru,ky,description,translation],index)=>{
 const i=index+1;
 return [
  image(photoPrefix+i+(photoPrefix==="chapter"?"Photo":""),crop(filenamePrefix+i+(options.suffix??"-reference.png"),photo(ru+" — фото",ky+" — сүрөт")),{radius:options.radius??3,rotation:options.rotation?.[index]??0}),
  text(textPrefix+i+(textPrefix==="chapter"?"Text":"Copy"),[
   [day,ru.toUpperCase(),description].join("\n"),[day,ky.toUpperCase(),translation].join("\n"),
  ],options.size??16,{...field([ru,ky],textPrefix+i+"Copy"),line:1.28,weight:530}),
 ];
});
const closed = ["ДО ВСТРЕЧИ!","КӨРҮШКӨНЧӨ!"];
const darkVogue = "#171717";
const vogue = {
 description:"Монохромная обложка, лаконичная программа и контрастная гостевая форма.",
 tokens:{paper:"#F4F2EF",ink:"#111111",accent:"#951F25"},
 pages:{
  cover:page([
   image("coverPhoto",crop("cover-portrait-reference.png",photoLabel),{focal:[.5,.22]}),
   shape("coverRule","#951F25"),
   label("coverEyebrow","ПРИГЛАШЕНИЕ\nНА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРУУ"),
   names("coverNames",73,{align:"left",line:.92,spacing:-3}),
   shape("dateBacking","#F4F2EF",{box:box(0,872,390,176),opacity:.94}),
   date("coverDate",27,{color:"#951F25",spacing:3}),
   action("coverScroll",next,"arrow"),
  ]),
  invitation:page([
   invite("invitationText",19,{spacing:1.6}),
   shape("invitationRule","#951F25"),widget("countdownWidget","countdown"),
   shape("sectionRule","#B7AFAB"),sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",26),
   widget("scheduleWidget","schedule"),
   image("mountainsFooter",decoration("mountains-light.png")),
  ]),
  gallery:page([
   sectionTitle("galleryHeading","ГАЛЕРЕЯ","СҮРӨТТӨР",25,{align:"left"}),shape("galleryRule","#951F25"),
   widget("galleryWidget","gallery",{layout:"stackedMosaic"},{images:[1,2,3,4].map(i=>crop("gallery-0"+i+".png",portrait))}),
   shape("venueRule","#951F25"),sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",21,{align:"left"}),
   image("venuePhoto",crop("venue.png",venueLabel),{radius:5}),venueName("venueName"),
   venueAddress("venueAddress"),outlineMap("mapButton"),
  ]),
  rsvpPage:page([
   shape("rsvpRule","#C65A56"),sectionTitle("rsvpHeading","ПОДТВЕРДИТЕ\nСВОЁ УЧАСТИЕ","КАТЫШУУҢУЗДУ\nЫРАСТАҢЫЗ",34),
   guestIntro("rsvpIntro",{spacing:1.6}),
   form("rsvpWidget",{block:{layout:"stacked",wish:false},accent:"#F4F2EF",buttonInk:"#171717"}),
   shape("thanksRule","#C65A56"),sectionTitle("thanksText","СПАСИБО,\nЧТО ВЫ С НАМИ","БИЗ МЕНЕН БОЛГОНУҢУЗ\nҮЧҮН РАХМАТ",20),
   image("mountainsFooterDark",decoration("mountains-dark.png")),
   music("music",{box:box(326,857,44,47)}),
  ],{background:darkVogue,ink:"#F4F2EF"}),
 },
};

const olive="#343E2B";
const italian = {
 description:"Итальянская вилла, календарь, полароиды и приглашение в тёплой оливковой палитре.",
 tokens:{paper:"#F4EBDD",ink:olive,accent:"#5B613F"},
 pages:{
  cover:page([
   image("coverArch",crop("cover-scene-reference.png",undefined,[0,0,372,119]),{box:box(0,0,390,125)}),
   image("coverScene",crop("cover-scene-reference.png",photoLabel,[0,443,372,425]),{box:box(0,442,390,446),focal:[.5,.4]}),
   label("coverBrand","ITALIAN\nROMANCE","ITALIAN\nROMANCE",centered),shape("coverTopRule","#9D7B56"),
   label("coverEyebrow","ПРИГЛАШЕНИЕ\nНА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРУУ",centered),
   names("coverNames",67),shape("coverBottomPaper","#F4EBDD"),
   date("coverDate",26),venueName("coverVenue",{...centered,size:15}),action("scrollNext",next,"arrow"),
  ]),
  invitation:page([
   image("villaSketch",decoration("villa-sketch.png")),image("oliveTop",decoration("olive-top.png")),
   invite("invitationCopy",17,{spacing:1}),shape("ruleAboveCalendar","#AF976C",{box:box(77,239,239,1)}),
   calendar("calendar","month"),label("calendarNote","ДЕНЬ НАШЕЙ СВАДЬБЫ","БИЗДИН ТОЙ КҮНҮ",centered),
   sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",24),widget("program","schedule"),
   image("landscapeFooter",decoration("landscape-footer.png")),
  ]),
  gallery:page([
   sectionTitle("storyQuote","В КАЖДОМ МГНОВЕНИИ —\nНАША ИСТОРИЯ","АР БИР КӨЗ ИРМЕМДЕ —\nБИЗДИН ТАРЫХ",23),shape("quoteRule","#A78D69"),
   widget("polaroidGallery","gallery",{layout:"polaroids"},{images:["left","center","right"].map(position=>crop("gallery-"+position+"-reference.png",portrait))}),
   image("venueStoryPreview",crop("venue-reference.png",photo("Фото истории","Баяндын сүрөтү")),{radius:7}),
   sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",22),
   venueName("venueName",{size:17}),inlineLocation("venueCard",{box:box(24,780,345,75)}),
   image("venuePhoto",crop("venue-reference.png",venueLabel),{radius:8}),
  ]),
  rsvpPage:page([
   image("envelope",decoration("envelope-seal.png")),
   sectionTitle("rsvpHeading","ПОДТВЕРДИТЕ\nСВОЁ УЧАСТИЕ","КАТЫШУУҢУЗДУ\nЫРАСТАҢЫЗ",29),
   guestIntro("rsvpIntro"),form("rsvpWidget"),music("musicCard"),
   image("thanksOlive",decoration("thanks-olive.png")),sectionTitle("thanksText",closed[0],closed[1],25),shape("thanksRule","#A78D69"),
  ]),
 },
};

const boarding = {
 description:"Свадебный маршрут с иллюминатором, посадочным билетом и личными главами.",
 pages:{
  cover:page([
   shape("window", "#B58566",{box:box(34,135,362,720),radius:155,stroke:"#EFE0C8"}),
   image("windowPhoto",region(1,[103,300,222,207],photoLabel),{box:box(53,160,324,667),mask:"arch",focal:[.54,.25]}),
   shape("captionBacking","#472620",{box:box(55,474,320,351),radius:35,opacity:.82}),
   sectionTitle("header","BOARDING PASS","BOARDING PASS",31),
   label("eyebrow","ПРИГЛАШЕНИЕ НА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО ЧАКЫРУУ",{...centered,color:"#FFF4DF"}),
   names("names",62,{color:"#FFF4DF"}),date("date",26,{color:"#FFF4DF"}),
   venueName("venue",{...centered,size:16,color:"#FFF4DF"}),image("luggage",region(1,[0,852,430,180])),
   action("next",next,"arrow"),
  ],{background:"#85614E",ink:"#FFF4DF",accent:"#722721"}),
  ticket:page([
   shape("boardingTicket","#F8F1E6",{radius:12,stroke:"#C58C56"}),
   sectionTitle("title","ПОСАДОЧНЫЙ БИЛЕТ","ОТУРУУ БИЛЕТИ",25),
   ...[1,3,2,1,4,1,3,2,4,2,1,3,1,4,3,1,1,3,2,1].map((weight,i)=>shape("barcode"+i,"#241A17",{box:box(303+i*4,118,weight,19)})),
   label("flight","РЕЙС · EQ 2905","КАТТАМ · EQ 2905"),
   date("date",20,{dateFormat:"numeric"}),
   sectionTitle("route","ИЗ БИШКЕКА · К НАШЕМУ ТОЮ","БИШКЕКТЕН · БИЗДИН ТОЙГО",21),
   label("departureArrival","СБОР ГОСТЕЙ · ЦЕРЕМОНИЯ","КОНОКТОРДУ ТОСУУ · НИКЕ САЛТАНАТЫ",centered),
   shape("perforation","#C58C56",{opacity:.7}),
   sectionTitle("heading","НАША ИСТОРИЯ","БИЗДИН ТАРЫХ",26),
   ...chapters("chapter","chapter","ticket-chapter",{suffix:"Photo-reference.png",size:14}),
   image("stamp",region(2,[20,954,389,160])),
  ]),
  event:page([
   image("venuePhoto",crop("event-venuePhoto-reference.png",venueLabel)),
   label("destination","ПУНКТ НАЗНАЧЕНИЯ","БАРУУЧУ ЖЕР",centered),
   venueName("venueTitle",centered),venueAddress("venueAddress",centered),outlineMap("map"),
   sectionTitle("heading","ПРОГРАММА ПОЛЁТА","САПАРДЫН ПРОГРАММАСЫ",28),
   widget("program","schedule"),calendar("calendar"),image("passport",region(3,[0,977,430,167])),
  ]),
  rsvp:page([
   image("mapDecor",region(4,[0,0,430,154])),sectionTitle("heading",reply[0],reply[1],36),
   guestIntro("intro"),compactForm(32,319,366,459),music("music"),
   image("closing",region(4,[0,941,430,206])),
  ],{background:"#4C2021",ink:"#FFF4DF",accent:"#C68A55",buttonInk:"#251916"}),
 },
};

const cinema = {
 description:"Кинематографичное приглашение с тремя главами, тёмным постером и тёплой плёнкой.",
 pages:{
  cover:page([
   image("heroPoster",region(1,[13,193,403,346],photoLabel),{focal:[.5,.35]}),
   shape("shadow","#201914",{box:box(0,729,430,173),opacity:.8}),
   sectionTitle("header","КИНО О ЛЮБВИ","СҮЙҮҮ ТУУРАЛУУ ТАСМА",29),
   label("eyebrow","ПРЕМЬЕРА НАШЕЙ ИСТОРИИ","БИЗДИН ТАРЫХТЫН ПРЕМЬЕРАСЫ",centered),
   names("names",78),date("date",30,{spacing:1}),
   venueName("venue",{...centered,size:18}),
   image("landscape",region(1,[0,1323,430,245])),
   action("next",next,"arrow"),
  ]),
  story:page([
   image("filmTrim",region(2,[0,0,110,108])),
   sectionTitle("heading","НАША\nИСТОРИЯ\nВ КАДРАХ","БИЗДИН\nТАРЫХ\nКАДРЛАРДА",41),
   invite("intro",17),
   image("storyVideo",crop("event-venueHero-reference.png",photo("Кадр фильма","Тасманын кадры")),{radius:7}),
   ...chapters("episode","episode","story-episode",{suffix:"-reference.png",size:16}),
   image("reel",region(2,[0,1530,430,252])),
  ],{background:"#F0DCC5",ink:"#392720"}),
  event:page([
   image("venueHero",crop("event-venueHero-reference.png",photo("Панорама","Панорама"))),
   sectionTitle("dateHeading","ДАТА ПРЕМЬЕРЫ","ПРЕМЬЕРА КҮНҮ",25),
   date("date",39),calendar("calendar"),shape("divider","#A52825"),
   sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",30),widget("program","schedule"),
   sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",26),
   image("venuePhoto",crop("event-venuePhoto-reference.png",venueLabel),{radius:8}),
   venueName("venueText",{...centered,size:25,box:box(41,1451,366,34)}),
   venueAddress("venueAddress",{...centered,box:box(39,1490,352,31)}),outlineMap("map"),
   image("foliage",region(3,[228,1630,202,140])),
  ],{background:"#F9EFE4",ink:"#3C2C24"}),
  rsvp:page([
   image("clapper",region(4,[0,0,430,334])),
   sectionTitle("heading",reply[0],reply[1],38),guestIntro("intro"),
   compactForm(28,536,374,673,{layout:"stacked"}),music("music"),image("closing",region(4,[0,1417,430,365])),
  ],{background:"#261C17",ink:"#F8F1E7"}),
 },
};

const garden = {
 description:"Цветочная арка, история пары, календарь и зелёная гостевая форма.",
 tokens:{ink:"#28331C",accent:"#49603B"},
 pages:{
  cover:page([
   image("gatePoster",region(1,[0,120,430,442],photoLabel),{box:box(0,111,430,465)}),
   shape("gateMat","#F7EBDD",{box:box(22,532,386,512),radius:25,opacity:.98}),
   sectionTitle("header","SECRET GARDEN","SECRET GARDEN",30,{color:"#FFF9ED"}),
   label("eyebrow","ПРИГЛАШЕНИЕ НА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО ЧАКЫРУУ",centered),
   names("names",64),date("date",29),venueName("venue",{...centered,size:16}),
   action("openGate",["Открыть приглашение","Чакырууну ачуу"],"arrow"),
  ],{background:"#25331E"}),
  story:page([
   image("flowers",region(2,[282,0,148,115]),{box:box(282,0,148,115)}),
   sectionTitle("heading","НАША\nИСТОРИЯ","БИЗДИН\nТАРЫХ",37),
   invite("intro",16),shape("storyLine","#A85A4C"),
   ...chapters("chapter","chapter","story-chapter",{suffix:"Photo-reference.png",radius:56,size:15}),
   shape("letter","#F0DFC8",{stroke:"#B49E72",rotation:-3}),
   sectionTitle("letterCopy","С ЛЮБОВЬЮ,\nАЛИБЕК И АЛИНА","СҮЙҮҮ МЕНЕН,\nАЛИБЕК ЖАНА АЛИНА",25,{line:1.12}),
  ]),
  event:page([
   image("heroPhoto",crop("event-heroPhoto-reference.png",photo("Панорама сада","Бакчанын панорамасы"))),
   calendar("calendar","month"),
   sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",25),
   widget("program","schedule"),
   image("venuePhoto",crop("event-venuePhoto-reference.png",venueLabel),{radius:11}),
   venueName("name",{box:box(53,977,360,30),size:18}),
   inlineLocation("venueCard",{box:box(23,1001,384,91)}),
  ]),
  rsvp:page([
   image("heroDecor",region(4,[0,0,430,185])),
   sectionTitle("heading",reply[0],reply[1],34),guestIntro("intro"),
   compactForm(34,377,361,440),music("music"),
   sectionTitle("thanks",closed[0],closed[1],25),
   image("flowers",region(4,[335,957,95,186]),{box:box(335,957,95,186)}),
  ],{background:"#26351F",ink:"#FFFAF0",accent:"#E6CFA4",buttonInk:"#26351F"}),
 },
};

const newspaper = {
 description:"Свадебный выпуск с крупным мастхедом, редакционными колонками и репортажными кадрами.",
 pages:{
  cover:page([
   sectionTitle("masthead","СВАДЕБНЫЙ\nВЕСТНИК","ТОЙ\nКАБАРЧЫСЫ",31,{weight:720,spacing:-1}),
   shape("editionRule","#161412",{box:box(15,108,400,1)}),
   label("edition","СПЕЦИАЛЬНЫЙ ВЫПУСК · БИШКЕК","АТАЙЫН ЧЫГАРЫЛЫШ · БИШКЕК",centered),
   names("names",81,{weight:720}),
   date("dateVenue",23,{dateFormat:"date-time",color:"#941D24"}),
   image("coverPhoto",crop("cover-coverPhoto-reference.png",photoLabel,[0,0,408,433]),{clip:[[0,0],[100,0],[100,92],[91,91],[80,96],[52,94],[33,100],[0,95]]}),
   shape("headlinePaper","#F9F1E5",{box:box(25,882,380,123),rotation:-2}),
   sectionTitle("headline","МЫ ЖЕНИМСЯ!","БИЗ ҮЙЛӨНӨБҮЗ!",37,{weight:800}),
   invite("intro",15),
   action("next",next,"arrow"),
  ]),
  story:page([
   sectionTitle("heading","НАША ИСТОРИЯ","БИЗДИН ТАРЫХ",37,{weight:700}),
   label("subtitle","ИСТОРИЯ В ТРЁХ ГЛАВАХ","ҮЧ БӨЛҮМДӨГҮ ТАРЫХ",centered),
   ...chapters("chapter","chapter","story-chapter",{suffix:"Photo-reference.png",size:15,rotation:[-4,3,-2]}),
   sectionTitle("quote","«У КАЖДОЙ ИСТОРИИ\nЕСТЬ НАЧАЛО»","«АР БИР ТАРЫХТЫН\nБАШТАЛЫШЫ БАР»",24),
   image("landscape",region(2,[0,1000,430,147])),
  ]),
  event:page([
   sectionTitle("heading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",36,{weight:700}),
   label("subtitle","РАСПИСАНИЕ · БИШКЕК","ЖҮГҮРТМӨ · БИШКЕК",centered),
   widget("program","schedule"),
   sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",27),
   image("venuePhoto",crop("event-venuePhoto-reference.png",venueLabel),{radius:4}),
   venueName("name",{box:box(57,763,345,31),size:21}),
   inlineLocation("venueCard",{box:box(30,798,370,95)}),
   calendar("calendar","button",{box:box(34,915,361,53)}),
   shape("fact","#F9F1E5",{stroke:"#8B7763",box:box(22,976,280,144)}),
   label("factLabel","ДО СВАДЬБЫ","ТОЙГО ЧЕЙИН",{box:box(42,993,230,28)}),
   widget("countdown","countdown",{layout:"days"},{box:box(43,1030,230,65)}),
   image("camera",region(3,[308,980,122,173]),{box:box(308,980,122,173)}),
  ]),
  rsvp:page([
   image("newspaperDecor",region(4,[0,0,430,253])),sectionTitle("heading",reply[0],reply[1],35),
   guestIntro("intro"),compactForm(32,437,366,487),music("music"),
  ]),
 },
};

const envelope = {
 description:"Бумажный конверт с печатью, открытка, тёплые изображения и оливковая форма RSVP.",
 tokens:{ink:"#29301B",accent:"#655B37"},
 pages:{
  envelope:page([
   sectionTitle("header","DIGITAL\nENVELOPE","DIGITAL\nENVELOPE",30,{color:"#F4E4CC"}),
   image("envelopeBack",region(1,[45,181,340,441])),
   label("eyebrow","ПРИГЛАШЕНИЕ НА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО ЧАКЫРУУ",{...centered,color:"#F4E4CC"}),
   names("names",65,{color:"#FFF8E9"}),date("date",26,{color:"#FFF8E9"}),
   venueName("venue",{...centered,size:17,color:"#FFF8E9"}),
   action("open",["Открыть приглашение","Чакырууну ачуу"],"solid","next",{accent:"#EEDCC1",buttonInk:"#29301B"}),
  ],{background:"#303923"}),
  invitation:page([
   shape("envelopeBack","#C49765",{radius:27,rotation:-4}),
   shape("card","#FBF1E2",{radius:16,rotation:-2,stroke:"#D6B68D"}),
   image("leaves",region(2,[27,147,354,78]),{box:box(27,145,354,82),rotation:-2}),
   sectionTitle("greeting","ДОРОГИЕ ГОСТИ!","УРМАТТУУ КОНОКТОР!",25),
   invite("intro",17),names("names",60),date("date",27),
   image("villa",region(2,[45,734,337,185],photo("Пейзаж на открытке","Ачык каттагы пейзаж")),{radius:6,rotation:-3}),
   shape("envelopeFront","#D8B68B",{box:box(0,939,430,223),clip:[[0,0],[51,27],[100,0],[100,100],[0,100]]}),
  ]),
  event:page([
   sectionTitle("heading","ГАЛЕРЕЯ","СҮРӨТТӨР",27),
   widget("gallery","gallery",{layout:"polaroids"},{images:[
    region(3,[33,123,111,118],portrait),region(3,[160,123,108,124],portrait),region(3,[293,135,108,115],portrait),
   ]}),
   sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",27),widget("program","schedule"),
   sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",24),
   image("venuePhoto",crop("event-venuePhoto-reference.png",venueLabel),{radius:8}),
   venueName("venueName",{box:box(56,947,350,32),size:18}),
   venueAddress("venueAddress",{box:box(56,981,352,24)}),outlineMap("map"),
  ]),
  rsvp:page([
   image("leaves",region(4,[287,0,143,108])),sectionTitle("heading",reply[0],reply[1],36),
   guestIntro("intro"),compactForm(34,305,361,485),music("music"),image("landscape",region(4,[0,958,430,189])),
  ],{background:"#303923",ink:"#FFF8E9",accent:"#EEDCC1",buttonInk:"#29301B"}),
 },
};

const exhibition = {
 description:"Приглашение как музейная выставка с голубыми акцентами, витриной и миниатюрами.",
 pages:{
  cover:page([
   label("label","EVENTIQ / EXHIBITION 01","EVENTIQ / КӨРГӨЗМӨ 01"),shape("rule","#173DDE"),
   title("heading",["ДВОЕ.\nОДНА\nИСТОРИЯ.","ЭКӨӨ.\nБИР\nТАРЫХ."],58,{family:"sans",weight:800,spacing:-2,line:.94}),
   text("names",storyNames,23,{...field(coupleLabel,"coupleNames"),weight:650}),
   image("cover",crop("couple.png",photoLabel),{focal:[.5,.42]}),
   date("date",18,{align:"left",family:"sans",color:"#173DDE",dateFormat:"date-time"}),
   invite("caption",17,{align:"left"}),action("open",["Открыть выставку","Көргөзмөнү ачуу"],"solid"),
  ]),
  exhibition:page([
   label("label","01 / ЭКСПОЗИЦИЯ","01 / КӨРГӨЗМӨ"),
   text("heading",["Наши\nмоменты","Биздин\nирмемдер"],48,{weight:750,spacing:-1,line:.94}),
   widget("gallery","gallery",{layout:"exhibition"},{
    box:box(24,204,382,810),images:["portrait","groom","travel","rings"].map((file,i)=>crop(file+".png",[["Портрет","Портрет"],["Жених","Күйөө"],["Путешествие","Саякат"],["Кольца","Шакектер"]][i])),
   }),
  ]),
  event:page([
   label("label","02 / ОТКРЫТИЕ","02 / АЧЫЛЫШ"),text("heading",["План\nвечера","Кечтин\nпланы"],49,{weight:750,line:1}),
   widget("program","schedule",{layout:"spaced"},{box:box(24,204,382,294)}),
   image("venuePhoto",crop("venue.png",venueLabel)),text("venueTitle",["Место проведения","Той өтүүчү жер"],23,{weight:700}),
   text("venue",["Villa Archa · Бишкек","Villa Archa · Бишкек"],19,field(venueTitle,"venueName","location")),
   outlineMap("map"),calendar("calendar"),
  ]),
  rsvp:page([
   label("label","03 / СПИСОК ГОСТЕЙ","03 / КОНОКТОРДУН ТИЗМЕСИ"),
   text("heading",["Вы с нами?","Сиз биз мененсизби?"],45,{weight:750,spacing:-1}),
   guestIntro("intro",{align:"left"}),compactForm(24,240,382,580),music("music"),
   text("closing",["До встречи.","Көрүшкөнчө."],22,{weight:700,color:"#173DDE"}),
  ]),
 },
};

const architecture = {
 description:"Архитектурная композиция с кобальтовым акцентом, интерактивным планом и дресс-кодом.",
 pages:{
  cover:page([
   image("hero",region(1,[13,464,396,467],photoLabel),{box:box(0,444,430,521),focal:[.5,.48]}),
   label("header","EVENTIQ / WEDDING","EVENTIQ / ТОЙ"),
   label("eyebrow","ПРИГЛАШЕНИЕ\nНА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРУУ"),shape("rule","#1430E5"),
   names("names",64,{align:"left",family:"sans",weight:750}),date("date",23,{align:"left",family:"sans"}),
   action("submitLink",reply,"solid","rsvp"),action("next",next,"arrow"),
  ]),
  plan:page([
   text("heading",["ПЛАН\nНАШЕГО ДНЯ","ТОЙ КҮНҮНҮН\nПЛАНЫ"],42,{weight:750,line:1}),
   shape("rule","#1430E5"),widget("plan","schedule",{layout:"plan"},{box:box(24,196,383,782)}),
   image("buildingSketch",region(2,[0,1031,430,120])),
  ]),
  venue:page([
   image("portrait1",crop("venue-portrait1-reference.png",photo("Портрет 1","1-портрет"))),
   shape("blueSquare","#1430E5"),image("portrait2",crop("venue-portrait2-reference.png",photo("Портрет 2","2-портрет"))),
   image("venuePhoto",crop("venue-venuePhoto-reference.png",venueLabel)),
   text("heading",["МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР"],27,{weight:750}),
   venueName("venueName"),venueAddress("venueAddress"),outlineMap("map"),
   shape("rule","#A0A0A0"),text("dressHeading",["ДРЕСС-КОД","КИЙИМ КОДУ"],24,{weight:750}),
   text("dressCopy",["Будем рады, если вы поддержите цветовую палитру.","Түстөр палитрасын колдосоңуз, кубанабыз."],15,field(["Дресс-код","Кийим коду"],"dressCode","appearance")),
   ...["#101113","#1430E5","#A0A0A0","#E5E1D8","#FFFFFF"].map((color,i)=>shape("swatch"+i,color,{box:box(33+i*74,1010,61,53),stroke:"#B1B3B5"})),
  ]),
  rsvp:page([
   text("heading",["ПОДТВЕРДИТЕ\nУЧАСТИЕ","КАТЫШУУҢУЗДУ\nЫРАСТАҢЫЗ"],39,{weight:760,line:1}),
   shape("rule","#1430E5"),guestIntro("intro",{align:"left"}),compactForm(34,278,361,587),music("music"),
   image("concrete",region(4,[0,1017,430,131])),
  ]),
 },
};

export const recipes = {
 "love-story":loveStory,"vogue-wedding":vogue,"italian-romance":italian,
 "cinema-wedding":cinema,"secret-garden":garden,"boarding-pass":boarding,
 "wedding-newspaper":newspaper,"digital-envelope":envelope,"art-gallery":exhibition,
 "minimal-architecture":architecture,
};
