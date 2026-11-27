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

const prepared = (name,label) => ({prepared:name+".webp",label,decorative:!label});
const paperPreset = {preset:"stationery"};
const paper = () => image("paperGrain",prepared("paper_grain"),{box:box(0,0,390,1045)});
const loveStorySchedule = [
 ["16:00","Сбор гостей\nПриветственные напитки","Конокторду тосуу\nСуусундуктар"],
 ["17:00","Церемония\nТоржественная регистрация","Нике салтанаты\nНикени каттоо"],
 ["18:30","Банкет\nПраздничный ужин и тосты","Банкет\nМайрамдык кечки тамак жана каалоолор"],
 ["22:00","Вечерняя программа\nМузыка, танцы и сюрпризы","Кечки программа\nМузыка, бий жана сюрприздер"],
].map(([time,ru,ky])=>({time,label:{ru,ky}}));

const loveStory = {
 description:"История пары в фотокарточках, билет на свадьбу и почтовый ответ гостя.",
 assetRevision:"vf-01",
 tokens:{accent:wine,paper:"#F1EBE1",ink:"#302824"},
 pages:{
  cover:page([
   image("coverSky",prepared("cover_sky"),{box:box(0,0,390,394)}),
   image("coverPhoto",prepared("cover_photo",photoLabel),{box:box(0,394,390,651),focal:[.5,.38]}),
   text("eyebrow",["ПРИГЛАШЕНИЕ\nНА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРУУ"],16,{box:box(36,43,208,43),weight:560,spacing:5.3,line:1.3}),
   shape("eyebrowRule",wine),
   title("names",["АЛИБЕК\nИ АЛИНА","АЛИБЕК\nЖАНА АЛИНА"],94,{...field(coupleLabel,"coupleNames"),box:box(37,141,347,190),spacing:-2.3,line:.95,weight:470,widthScale:.75,fitMinFontSize:46}),
   date("date",30,{box:box(39,345,335,40),align:"left",spacing:6.5,color:wine,dateFormat:"short-date"}),
   text("storyLink",["НАША ИСТОРИЯ","БИЗДИН ТАРЫХ"],19,{box:box(60,928,294,30),align:"center",spacing:6,color:"#302824",weight:520}),
   action("scrollIcon",next,"arrow"),
  ],{background:"#BCCCD4"}),
  story:page([
   paper(),
   image("oliveBranch",prepared("story_branches"),{box:box(209,0,181,166)}),
   shape("storyRule",wine),
   title("storyTitle",["НАША\nИСТОРИЯ","БИЗДИН\nТАРЫХ"],39,{box:box(43,67,290,83),spacing:6,line:1.02,weight:470,color:"#4F3029"}),
   text("storySubtitle",["ТРИ ГЛАВЫ, КОТОРЫЕ\nПРИВЕЛИ НАС К ЭТОМУ ДНЮ","БИЗДИ УШУЛ КҮНГӨ\nАЛЫП КЕЛГЕН ҮЧ БАЯН"],14,{box:box(45,159,322,42),spacing:2.8,weight:560,line:1.36}),
   shape("storyLine",wine),
   ...["meeting","trip","proposal"].flatMap((id,i)=>{
    const [day,ru,ky,description,translation]=chapterCopy[i];
    const photoBox=[box(214,226,187,216),box(210,484,174,200),box(217,716,170,185)][i];
    const turn=[-4.1,4.2,-4][i];
    return [
     shape(id+"Dot","#F2EAE0",{box:box(24,[273,506,735][i],14,14),shape:"circle",stroke:wine,strokeWidth:4}),
     title(id+"Date",[day,day],25,{...field([ru+" — дата",ky+" — күнү"],id+"Date"),box:box(54,[259,493,721][i],137,31),color:wine,weight:600}),
     text(id+"Title",[
      ["ПЕРВАЯ\nВСТРЕЧА","ПЕРВОЕ\nПУТЕШЕСТВИЕ","ОНА СКАЗАЛА\n«ДА»"][i],
      ["БИРИНЧИ\nЖОЛУГУШУУ","БИРИНЧИ\nСАЯКАТ","АЛ «ООБА»\nДЕДИ"][i],
     ],17,{...field([ru+" — заголовок",ky+" — аталышы"],id+"Title"),box:box(56,[294,529,756][i],139,47),family:i===2?"serif":"sans",weight:650,spacing:.55,line:1.17}),
     text(id+"Text",[description,translation],14,{...field([ru+" — описание",ky+" — баяны"],id+"Description"),box:box(56,[348,581,811][i],137,[100,88,72][i]),line:1.15,weight:460}),
     image(id+"Photo",prepared("story_"+id,photo(ru+" — фото",ky+" — сүрөт")),{box:photoBox,rotation:turn}),
     image(id+"Film",prepared("story_"+id+"_frame"),{box:[box(179,215,211,247),box(183,472,207,232),box(192,701,198,222)][i]}),
     text(id+"Number",[`0${i+1}`,`0${i+1}`],19,{box:box([352,358,349][i],[229,497,721][i],31,26),color:"#FFF9F1",weight:580,rotation:turn}),
    ];
   }),
   image("landscapeFooter",prepared("story_landscape"),{box:box(0,915,390,130)}),
  ]),
  details:page([
   paper(),
   image("ticketPaper",prepared("details_ticket"),{box:box(0,0,390,375)}),
   text("ticketEyebrow",["ПРИГЛАШАЕМ ВАС\nНА НАШУ СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРАБЫЗ"],15,{...field(inviteLabel,"invitationText"),box:box(64,62,260,41),align:"center",spacing:3.7,weight:620,rotation:-3.1,line:1.32}),
   date("ticketDate",46,{box:box(53,124,300,58),color:wine,spacing:0,widthScale:.9,rotation:-3.1,dateFormat:"short-date"}),
   date("ticketDay",17,{box:box(71,201,110,33),dateFormat:"weekday",family:"sans",weight:620,spacing:2,rotation:-3.1}),
   date("ticketTime",30,{box:box(191,189,113,37),dateFormat:"time",color:wine,rotation:-3.1}),
   widget("calendarAction","calendar",{layout:"button",title:{ru:"В календарь",ky:"Жылнаамага"}},{...paperPreset,box:box(140,263,211,49),rotation:-2.3}),
   shape("dayRuleLeft",wine,{box:box(37,411,51,1)}),
   shape("dayRuleRight",wine,{box:box(312,411,51,1)}),
   title("dayHeading",["НАШ ДЕНЬ","ТОЙ КҮНҮ"],32,{box:box(86,390,220,41),align:"center",spacing:5.6,weight:500,widthScale:.86,color:"#4F3029"}),
   widget("program","schedule",{layout:"rows"},{...paperPreset,items:loveStorySchedule,box:box(36,441,342,193)}),
   image("venuePhoto",prepared("details_venue",venueLabel),{radius:17}),
   map("mapAction",{...paperPreset,box:box(26,856,337,120),block:{showAddress:true},address:["г. Бишкек, ул. Курманжан Датки, 45","Бишкек ш., Курманжан Датка көч., 45"]}),
   title("venueName",venue,25,{...field(venueTitle,"venueName","location"),box:box(71,847,296,32),weight:630,color:"#1E1B18"}),
   image("venueFoliage",prepared("details_foliage"),{box:box(206,964,184,81)}),
  ]),
  rsvpPage:page([
   paper(),
   image("airmailBorder",prepared("rsvp_border")),
   image("stamp",prepared("rsvp_stamp"),{box:box(253,37,117,104)}),
   title("rsvpHeading",["ОТПРАВЬТЕ\nСВОЙ ОТВЕТ","ЖООБУҢУЗДУ\nЖӨНӨТҮҢҮЗ"],30,{box:box(43,68,220,66),spacing:3.5,widthScale:.92,weight:470,line:1.05}),
   text("rsvpIntro",["Будем рады разделить этот\nособенный день вместе с вами.","Бул өзгөчө күндү сиздер менен\nбирге өткөрүүгө кубанычтабыз."],16,{...field(["Текст перед формой","Анкетанын алдындагы текст"],"rsvpIntro","rsvp"),box:box(43,150,311,46),spacing:.25,line:1.35}),
   form("rsvpWidget",{...paperPreset,box:box(34,214,332,426)}),
   widget("music","music",{
    title:{ru:"Наш трек",ky:"Биздин трек"},caption:{ru:"Свадебная мелодия",ky:"Тойдун обону"},
   },{...paperPreset,allowUpload:true,cover:prepared("rsvp_music_cover")}),
   image("closingPhoto",prepared("rsvp_closing",photo("Финальный снимок","Акыркы сүрөт")),{
    box:box(0,720,390,269),clip:[[0,20],[8,19],[48,10],[94,0],[100,87],[85,94],[71,92],[59,86],[44,91],[28,95],[0,100]],
   }),
   image("closingTape",prepared("rsvp_tape"),{box:box(25,726,102,56)}),
   image("closingPaper",prepared("rsvp_footer"),{box:box(0,941,390,104)}),
  ]),
 },
};

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
const vogueInk = "#101010";
const voguePaper = "#F8F5F2";
const vogueRed = "#BD201D";
const contactSheet = {preset:"contact-sheet"};
const vogue = {
 description:"Монохромная журнальная обложка, контактный лист и контрастная гостевая форма.",
 assetRevision:"vf-02",
 tokens:{paper:voguePaper,ink:vogueInk,accent:vogueRed},
 pages:{
  cover:page([
   image("coverPhoto",prepared("cover-portrait",photoLabel),{monochrome:true,focal:[.5,.36]}),
   shape("coverRule",vogueRed),
   label("coverEyebrow","ПРИГЛАШЕНИЕ\nНА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРУУ",{box:box(39,54,269,49),size:17,weight:700,spacing:6.7,line:1.43}),
   names("coverNames",108,{box:box(29,132,361,204),align:"left",line:.94,spacing:-3.7,weight:470,widthScale:.70,fitMinFontSize:43}),
   image("coverFabric",prepared("cover-fabric"),{box:box(0,803,390,245)}),
   date("coverDate",31,{box:box(48,891,302,45),color:vogueRed,family:"sans",weight:740,spacing:5.1,fitMinFontSize:22}),
   action("coverScroll",next,"arrow","next",contactSheet),
  ]),
  invitation:page([
   text("invitationText",[
    "С РАДОСТЬЮ ПРИГЛАШАЕМ\nВАС РАЗДЕЛИТЬ С НАМИ\nОСОБЕННЫЙ ДЕНЬ —\nНАШУ СВАДЬБУ",
    "БИЗ ҮЧҮН ӨЗГӨЧӨ КҮНДҮ —\nҮЙЛӨНҮҮ ТОЮБУЗДУ —\nБИЗ МЕНЕН БИРГЕ ӨТКӨРҮҮГӨ\nЧАКЫРАБЫЗ",
   ],18,{...field(inviteLabel,"invitationText"),box:box(22,78,346,107),align:"center",spacing:2.25,line:1.46,weight:530}),
   shape("invitationRule",vogueRed),widget("countdownWidget","countdown",{},contactSheet),
   shape("sectionRule","#DAD5CF",{box:box(29,363,336,1)}),
   sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",23,{family:"sans",weight:720,align:"left",spacing:5.35,line:1.2,fitMinFontSize:17}),
   widget("scheduleWidget","schedule",{},{
    ...contactSheet,box:box(28,450,339,385),
    items:[
     ["16:00","Сбор гостей\nПриветственные напитки","Конокторду тосуу\nСуусундуктар"],
     ["17:00","Церемония\nТоржественная регистрация брака","Салтанат\nНикени каттоо"],
     ["18:30","Банкет\nПраздничный ужин\nи развлекательная\nпрограмма","Майрамдык дасторкон\nКечки тамак жана көңүл ачуу программасы"],
     ["22:00","Завершение\nОкончание вечера","Кеченин аягы\nТойдун жыйынтыгы"],
    ].map(([time,ru,ky])=>({time,label:{ru,ky}})),
   }),
   image("mountainsFooter",prepared("mountains-light")),
  ]),
  gallery:page([
   sectionTitle("galleryHeading","ГАЛЕРЕЯ","СҮРӨТТӨР",23,{family:"sans",weight:720,align:"left",spacing:5,line:1.2}),
   shape("galleryRule",vogueRed),
   widget("galleryWidget","gallery",{layout:"stackedMosaic"},{...contactSheet,images:[1,2,3,4].map(i=>prepared(`gallery-0${i}`,portrait))}),
   shape("venueRule",vogueRed),
   sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",21,{family:"sans",weight:710,align:"left",spacing:4.5,line:1.15,fitMinFontSize:17}),
   image("venuePhoto",prepared("venue",venueLabel),{monochrome:true}),
   image("venuePin",prepared("venue-pin"),{box:box(25,878,28,34)}),
   text("venueName",["РЕСТОРАН «АЛА-ТОО»","«АЛА-ТОО» РЕСТОРАНЫ"],20,{
    ...field(venueTitle,"venueName","location"),weight:730,spacing:.6,
   }),
   text("venueAddress",["г. Бишкек, ул. Курманжан Датки, 45","Бишкек ш., Курманжан Датка көч., 45"],16,{
    ...field(["Адрес","Дарек"],"venueAddress","location"),weight:500,
   }),
   outlineMap("mapButton",contactSheet),
  ]),
  rsvpPage:page([
   shape("rsvpRule",vogueRed),
   sectionTitle("rsvpHeading","ПОДТВЕРДИТЕ\nСВОЁ УЧАСТИЕ","КАТЫШУУҢУЗДУ\nЫРАСТАҢЫЗ",49,{
    box:box(23,81,344,108),line:1.04,weight:490,spacing:-.6,widthScale:.92,fitMinFontSize:34,
   }),
   text("rsvpIntro",[
    "БУДЕМ РАДЫ\nРАЗДЕЛИТЬ ЭТОТ\nОСОБЕННЫЙ ДЕНЬ\nВМЕСТЕ С ВАМИ",
    "БУЛ ӨЗГӨЧӨ КҮНДҮ\nСИЗДЕР МЕНЕН БИРГЕ\nӨТКӨРҮҮГӨ\nКУБАНЫЧТАБЫЗ",
   ],16,{...field(["Вступление к анкете","Анкетага кириш сөз"],"rsvpIntro","rsvp"),box:box(59,211,272,99),align:"center",spacing:4.5,line:1.51,weight:520}),
   form("rsvpWidget",{...contactSheet,block:{layout:"stacked",wish:false},accent:"#FAFAF8",buttonInk:vogueInk}),
   shape("thanksRule",vogueRed),
   sectionTitle("thanksText","СПАСИБО,\nЧТО ВЫ С НАМИ!","БИЗ МЕНЕН БОЛГОНУҢУЗ\nҮЧҮН РАХМАТ!",17,{
    family:"sans",weight:530,spacing:4.7,line:1.45,fitMinFontSize:14,
   }),
   image("mountainsFooterDark",prepared("mountains-dark"),{box:box(0,912,390,136)}),
   music("music",{box:box(326,857,44,47)}),
  ],{background:"#0F0F0F",ink:"#FAFAF8"}),
 },
};

const tuscanInk = "#34271C";
const tuscanOlive = "#30351D";
const tuscanCream = "#F9EBD6";
const terracotta = "#A43E23";
const postcard = {preset:"postcard"};
const tuscanPaper = () => image("paperGrain",prepared("paper-grain"),{box:box(0,0,390,1058)});
const tuscanVenue = ["Villa Toscana","Villa Toscana"];
const italian = {
 description:"Итальянская вилла, календарь, полароиды и приглашение в тёплой оливковой палитре.",
 assetRevision:"vf-03",
 tokens:{paper:"#F7EBDB",ink:tuscanInk,accent:terracotta},
 pages:{
  cover:page([
   image("coverArch",prepared("cover-arch"),{box:box(0,0,390,463)}),
   image("coverScene",prepared("cover-scene",photoLabel),{box:box(0,463,390,443),focal:[.5,.46]}),
   label("coverBrand","ITALIAN\nROMANCE","ITALIAN\nROMANCE",{...centered,box:box(138,131,135,48),size:15,spacing:5,line:1.55,weight:620}),
   shape("coverTopRule","#A27B4C",{box:box(173,189,65,1)}),
   shape("coverTopMark","#A27B4C",{box:box(202,186,6,6),rotation:45}),
   label("coverEyebrow","ПРИГЛАШЕНИЕ\nНА СВАДЬБУ","ҮЙЛӨНҮҮ ТОЙГО\nЧАКЫРУУ",{
    ...centered,box:box(82,208,245,46),size:15,spacing:4.6,line:1.53,weight:630,
   }),
   title("coverNames",["Алибек\n&\nАлина","Алибек\n&\nАлина"],69,{
    ...field(coupleLabel,"coupleNames"),box:box(66,274,279,189),align:"center",line:.85,weight:460,spacing:-1.15,
    fitMinFontSize:39,accentLine:{text:"&",color:terracotta},
   }),
   image("coverBottomPaper",prepared("cover-paper"),{box:box(0,810,390,248)}),
   date("coverDate",27,{box:box(84,914,251,36),dateFormat:"short-date",spacing:5.4,weight:530,fitMinFontSize:20}),
   text("coverVenue",tuscanVenue,15,{...field(venueTitle,"venueName","location"),box:box(101,958,220,23),align:"center",color:terracotta,weight:650,spacing:3.4}),
   action("scrollNext",next,"arrow","next",{...postcard,box:box(181,985,52,52)}),
  ]),
  invitation:page([
   tuscanPaper(),
   image("villaSketch",prepared("invitation-ornament"),{box:box(0,0,390,132)}),
   title("invitationCopy",[
    "С радостью приглашаем вас\nразделить с нами\nособенный день —\nнашу свадьбу",
    "Өзгөчө күнүбүздү —\nүйлөнүү тоюбузду —\nбиз менен бирге өткөрүүгө\nкубаныч менен чакырабыз",
   ],21,{...field(inviteLabel,"invitationText"),...centered,box:box(33,131,324,94),line:1.095,weight:480,spacing:.4,fitMinFontSize:17}),
   shape("ruleAboveCalendar","#A99374",{box:box(77,241,239,1)}),
   shape("calendarMark","#976224",{box:box(192,238,7,7),rotation:45}),
   calendar("calendar","month",{...postcard,box:box(22,250,348,284)}),
   text("calendarNote",["День нашей свадьбы ♡","Үйлөнүү тоюбуздун күнү ♡"],18,{
    box:box(93,530,263,34),family:"serif",align:"center",line:1.15,weight:520,color:terracotta,
   }),
   sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",24,{
    box:box(57,587,276,32),spacing:3.4,weight:480,fitMinFontSize:17,
   }),
   shape("programRuleLeft","#A99374",{box:box(30,622,38,1)}),
   shape("programRuleRight","#A99374",{box:box(323,622,38,1)}),
   widget("program","schedule",{},{
    ...postcard,box:box(31,640,336,288),
    items:[
     ["16:00","Сбор гостей\nПриветственные напитки\nи лёгкие закуски","Конокторду тосуу\nСуусундуктар жана жеңил тамактар"],
     ["17:00","Церемония\nТоржественная\nрегистрация брака","Салтанат\nНикени каттоо"],
     ["18:30","Банкет\nПраздничный ужин и развлекательная программа","Банкет\nМайрамдык кечки тамак жана көңүл ачуу"],
     ["22:00","Завершение\nОкончание вечера\nи тёплые пожелания","Кеченин аягы\nЖылуу каалоо-тилектер"],
    ].map(([time,ru,ky])=>({time,label:{ru,ky}})),
   }),
   image("landscapeFooter",prepared("invitation-landscape"),{box:box(0,932,390,126)}),
  ]),
  gallery:page([
   tuscanPaper(),
   image("galleryShadows",prepared("gallery-shadows"),{box:box(0,0,390,174)}),
   title("openingQuote",["“","“"],50,{box:box(48,42,39,49),grow:false,color:"#A46F3F",weight:460}),
   title("storyQuote",["Наша история — это\nпутешествие, которое\nпривело нас к этому дню","Биздин тарых —\nбизди ушул күнгө\nалып келген саякат"],21,{
    ...field(["Цитата","Цитата"],"quoteText"),...centered,box:box(57,56,278,85),line:1.22,weight:480,fitMinFontSize:16,
   }),
   title("closingQuote",["”","”"],50,{box:box(309,126,40,55),grow:false,color:"#A46F3F",weight:460}),
   shape("quoteRule","#A78D69",{box:box(158,153,67,1)}),
   widget("polaroidGallery","gallery",{layout:"polaroids"},{
    ...postcard,box:box(7,183,375,253),
    images:[
     prepared("polaroid-left",photo("Окно виллы","Вилланын терезеси")),
     prepared("polaroid-center",portrait),
     prepared("polaroid-right",photo("Лимоны","Лимондор")),
    ],
   }),
   image("venueStoryPreview",prepared("venue-story",photo("Фото истории","Баяндын сүрөтү")),{radius:18}),
   shape("venueRuleLeft","#A99374",{box:box(24,708,34,1)}),
   shape("venueRuleRight","#A99374",{box:box(337,708,28,1)}),
   sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",23,{
    box:box(28,694,334,32),spacing:1.3,weight:500,fitMinFontSize:17,
   }),
   map("venueCard",{...postcard,multilineAddress:true,block:{showAddress:false,nameKey:"venueName"},address:["г. Бишкек,\nул. Курманжан Датки, 45","Бишкек ш.,\nКурманжан Датка көч., 45"]}),
   image("venuePhoto",prepared("venue",venueLabel),{radius:19}),
  ]),
  rsvpPage:page([
   image("rsvpTexture",prepared("rsvp-texture"),{box:box(0,0,390,1058)}),
   image("envelope",prepared("envelope"),{box:box(0,0,390,159)}),
   sectionTitle("rsvpHeading","ПОДТВЕРДИТЕ\nСВОЁ УЧАСТИЕ","КАТЫШУУҢУЗДУ\nЫРАСТАҢЫЗ",33,{
    box:box(38,165,314,74),weight:460,spacing:2.2,line:1.12,fitMinFontSize:26,
   }),
   title("rsvpIntro",["Будем рады разделить этот\nособенный день вместе с вами","Бул өзгөчө күндү сиздер менен\nбирге өткөрүүгө кубанычтабыз"],18,{
    ...field(["Вступление к анкете","Анкетага кириш сөз"],"rsvpIntro","rsvp"),...centered,box:box(40,256,310,49),weight:470,line:1.16,
   }),
   form("rsvpWidget",{...postcard,accent:tuscanCream,buttonInk:tuscanInk,box:box(26,313,340,408)}),
   widget("musicCard","music",{
    title:{ru:"Наша музыка",ky:"Биздин музыка"},
   },{...postcard,accent:tuscanCream,buttonInk:tuscanOlive,allowUpload:true,cover:prepared("music-cover")}),
   image("rsvpFoliage",prepared("rsvp-foliage"),{box:box(0,883,390,175)}),
   image("thanksOlive",prepared("thanks-olive"),{box:box(147,850,84,41)}),
   title("thanksText",["Grazie!","Рахмат!"],55,{...centered,box:box(56,894,278,77),line:1.03,weight:450}),
   shape("thanksRule",tuscanCream,{box:box(165,996,62,1)}),
  ],{background:tuscanOlive,ink:tuscanCream,accent:tuscanCream}),
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

const film = {preset:"film"};
const filmDark = "#211914";
const filmIvory = "#F3E7D7";
const filmRed = "#A52825";
const filmInk = "#302017";
const filmPaper = "#F8EBDC";
const filmVenue = ["Villa Toscana","Villa Toscana"];
const filmPaperGrain = h => image("paperGrain",prepared("paper-grain"),{box:box(0,0,430,h)});
const filmShots = [
 [[21,27],[154,20],[166,211],[30,219]],
 [[24,22],[166,40],[144,216],[5,196]],
 [[16,31],[155,19],[169,220],[31,232]],
];
const filmChapters = [
 ["12.06.2022","Первая встреча","Биринчи жолугушуу","Мы познакомились совершенно случайно.","Биз күтүүсүз жерден таанышканбыз."],
 ["18.08.2023","Первое путешествие","Биринчи саякат","Наше первое совместное путешествие.","Биздин биринчи чогуу саякатыбыз."],
 ["14.02.2026","Она сказала «да»","Ал «ооба» деди","В этот день мы поняли — хотим провести вместе всю жизнь.","Ошол күнү өмүр бою бирге болууну чечтик."],
];
const filmSchedule = [
 ["16:00","Сбор гостей\nПриветственные напитки и лёгкие закуски","Конокторду тосуу\nСуусундуктар жана жеңил тамактар"],
 ["17:00","Церемония\nТоржественная регистрация брака","Салтанат\nНикени каттоо"],
 ["18:30","Банкет\nПраздничный ужин и развлекательная программа","Банкет\nМайрамдык кечки тамак жана көңүл ачуу"],
 ["22:00","Вечерняя часть\nМузыка, танцы и сюрпризы","Кечки программа\nМузыка, бий жана сюрприздер"],
].map(([time,ru,ky])=>({time,label:{ru,ky}}));
const cinema = {
 description:"Свадебная кинопремьера с постером, тремя эпизодами, программой и ответом гостя.",
 assetRevision:"vf-04",
 tokens:{paper:filmPaper,ink:filmInk,accent:filmRed},
 pages:{
  cover:page([
   image("heroPoster",prepared("hero-poster",photoLabel),{box:box(0,0,430,844),focal:[.5,.4]}),
   image("captionPaper",prepared("cover-caption-paper"),{box:box(0,844,430,486)}),
   image("landscape",prepared("cover-landscape"),{box:box(0,1330,430,411)}),
   image("laurelLeft",prepared("laurel-left"),{box:box(107,48,34,57)}),
   image("laurelRight",prepared("laurel-right"),{box:box(293,65,42,53)}),
   label("header","CINEMA\nWEDDING","CINEMA\nWEDDING",{...centered,box:box(144,58,142,46),size:17,spacing:7,line:1.15,weight:600}),
   label("posterCaption","КАДР НАШЕЙ ИСТОРИИ","БИЗДИН ТАРЫХТАН КАДР",{...centered,box:box(48,746,334,35),size:15,spacing:4.8,line:1.2}),
   label("eyebrow","ПРИГЛАШЕНИЕ\nНА НАШУ СВАДЬБУ","ҮЙЛӨНҮҮ ТОЮБУЗГА\nЧАКЫРУУ",{...centered,box:box(54,859,322,69),size:17,spacing:6,line:1.57,weight:600}),
   shape("ruleAboveNames","#D1B596",{box:box(200,944,53,2)}),
   title("names",["АЛИБЕК\n&\nАЛИНА","АЛИБЕК\n&\nАЛИНА"],79,{
    ...field(coupleLabel,"coupleNames"),...centered,box:box(38,973,354,242),line:.87,weight:460,spacing:-1,fitMinFontSize:44,accentLine:{text:"&",color:"#D7614D"},
   }),
   shape("ruleAboveDate","#D1B596",{box:box(191,1226,69,2)}),
   date("date",31,{box:box(47,1246,335,48),dateFormat:"short-date",spacing:6,weight:470,fitMinFontSize:23}),
   text("venue",filmVenue,17,{...field(venueTitle,"venueName","location"),...centered,box:box(46,1296,338,29),spacing:5.2,weight:560}),
   label("details","ПОДРОБНЕЕ","КЕНЕНИРЭЭК",{...centered,box:box(82,1616,266,24),size:14,spacing:4.4,weight:600}),
   action("next",next,"arrow","next",{...film,box:box(189,1653,52,52)}),
  ],{background:filmDark,ink:filmIvory}),
  story:page([
   filmPaperGrain(1782),
   image("filmTrim",prepared("film-trim"),{box:box(0,0,180,170)}),
   sectionTitle("heading","НАША\nИСТОРИЯ\nВ КАДРАХ","БИЗДИН\nТАРЫХ\nКАДРЛАРДА",34,{
    box:box(44,110,342,130),spacing:5.5,line:1.18,weight:550,fitMinFontSize:27,
   }),
   text("intro",["КОРОТКАЯ ИСТОРИЯ\nО ТОМ, КАК ВСЁ\nНАЧАЛОСЬ","БААРЫ КАНТИП\nБАШТАЛГАНЫ ТУУРАЛУУ"],19,{
    ...field(inviteLabel,"invitationText"),...centered,box:box(43,254,344,99),spacing:3.6,line:1.55,weight:530,fitMinFontSize:15,
   }),
   shape("stillMatte","#151312",{box:box(23,374,384,301),radius:22}),
   image("storyVideo",prepared("story-still",photo("Кадр истории","Баяндын кадры")),{box:box(24,411,382,216),focal:[.5,.5]}),
   label("stillCaption","КАДР ИЗ ИСТОРИИ","БАЯНДЫН КАДРЫ",{...centered,box:box(40,643,350,24),size:13,spacing:3,weight:550,color:filmIvory}),
   ...filmChapters.flatMap(([day,ru,ky,description,translation],i)=>{
    const episode=i+1;
    const at="episode"+episode;
    return [
     image(at,prepared("episode-"+episode,photo(ru+" — фото",ky+" — сүрөт")),{
      clip:filmShots[i].map(([x,y])=>[x/185*100,y/241*100]),
     }),
     image(at+"Frame",prepared("episode-"+episode+"-frame"),{box:box(22,[722,980,1247][i],185,241)}),
     text(at+"Copy",[[day,ru.toUpperCase(),description].join("\n"),[day,ky.toUpperCase(),translation].join("\n")],18,{
      ...field([ru,ky],at+"Copy"),box:box(218,[742,999,1264][i],190,208),line:1.35,weight:480,
      leadingLines:[
       {family:"serif",size:27,weight:610,color:"#8B2926"},
       {family:"sans",size:21,weight:750,color:filmInk},
      ],
     }),
    ];
   }),
   shape("episodeRule1","#BDA88E",{box:box(26,966,378,1)}),
   shape("episodeRule2","#BDA88E",{box:box(26,1232,378,1)}),
   image("reel",prepared("reel"),{box:box(0,1515,430,267)}),
  ]),
  event:page([
   filmPaperGrain(1770),
   image("venueHero",prepared("venue-hero",photo("Панорама виллы","Вилланын панорамасы")),{box:box(0,0,430,326)}),
   sectionTitle("dateHeading","ДАТА СВАДЬБЫ","ТОЙДУН КҮНҮ",24,{box:box(42,329,346,41),spacing:2.9,weight:540}),
   date("date",52,{box:box(66,373,83,64),dateFormat:"day",weight:520,fitMinFontSize:37}),
   date("month",52,{box:box(176,373,78,64),dateFormat:"month",weight:520,fitMinFontSize:37}),
   date("year",52,{box:box(280,373,128,64),dateFormat:"year",weight:520}),
   ...[["dayLabel","ДЕНЬ","КҮН",66,83],["monthLabel","МЕСЯЦ","АЙ",176,78],["yearLabel","ГОД","ЖЫЛ",280,128]].map(
    ([id,ru,ky,x,w])=>label(id,ru,ky,{...centered,box:box(x,434,w,25),size:13,spacing:3.1,weight:650})),
   shape("dateRule1","#9F8366",{box:box(156,389,1,56)}),
   shape("dateRule2","#9F8366",{box:box(267,389,1,56)}),
   widget("calendar","calendar",{layout:"button",title:{ru:"Добавить в календарь",ky:"Жылнаамага кошуу"}},{...film,box:box(31,473,368,56)}),
   shape("divider","#9F7650",{box:box(138,566,166,1)}),
   shape("dividerMark","#9F7650",{box:box(214,561,8,8),rotation:45}),
   sectionTitle("programHeading","ПРОГРАММА ДНЯ","ТОЙДУН ПРОГРАММАСЫ",29,{
    box:box(42,597,346,47),spacing:4.2,weight:540,fitMinFontSize:21,
   }),
   widget("program","schedule",{}, {...film,items:filmSchedule,box:box(26,665,378,394)}),
   shape("venueRule","#9F7650",{box:box(138,1090,166,1)}),
   shape("venueMark","#9F7650",{box:box(214,1085,8,8),rotation:45}),
   sectionTitle("venueHeading","МЕСТО ПРОВЕДЕНИЯ","ТОЙ ӨТҮҮЧҮ ЖЕР",28,{
    box:box(30,1118,370,45),spacing:3.4,weight:530,fitMinFontSize:20,
   }),
   image("venuePhoto",prepared("venue-photo",venueLabel),{box:box(17,1180,396,246),radius:22}),
   image("venuePin",prepared("venue-pin"),{box:box(35,1447,24,42)}),
   title("venueText",filmVenue,29,{box:box(72,1444,327,43),key:"venueName",weight:670}),
   text("venueAddress",["г. Бишкек, ул. Курманжан Датки, 45","Бишкек ш., Курманжан Датка көч., 45"],16,{
    ...field(["Адрес","Дарек"],"venueAddress","location"),box:box(72,1481,337,44),line:1.16,weight:540,
   }),
   outlineMap("map",film),
   image("foliage",prepared("venue-foliage"),{box:box(207,1616,223,154)}),
  ]),
  rsvp:page([
   image("clapper",prepared("clapper"),{box:box(0,0,430,343)}),
   image("closing",prepared("rsvp-closing"),{box:box(0,1417,430,365)}),
   sectionTitle("heading","ПОДТВЕРДИТЕ\nСВОЁ УЧАСТИЕ","КАТЫШУУҢУЗДУ\nЫРАСТАҢЫЗ",39,{
    box:box(29,351,372,105),spacing:1.4,line:1.13,weight:470,fitMinFontSize:31,
   }),
   title("intro",["Будем рады разделить этот\nособенный день вместе с вами","Бул өзгөчө күндү сиздер менен\nбирге өткөрүүгө кубанычтабыз"],20,{
    ...field(["Вступление к анкете","Анкетага кириш сөз"],"rsvpIntro","rsvp"),...centered,box:box(35,464,360,71),line:1.18,weight:470,
   }),
   form("response",{...film,box:box(27,535,376,675),block:{layout:"stacked",guestControl:"stepper",wish:true},buttonInk:"#FFFFFF"}),
   widget("music","music",{title:{ru:"Наша музыка",ky:"Биздин музыка"}},{
    ...film,box:box(22,1251,386,121),accent:filmIvory,buttonInk:filmDark,allowUpload:true,cover:prepared("music-cover"),
   }),
   title("closingText",["Grazie!","Рахмат!"],59,{box:box(46,1485,274,90),align:"left",line:1.14,weight:430}),
   shape("closingRule",filmIvory,{box:box(109,1586,94,1),rotation:-9}),
  ],{background:filmDark,ink:filmIvory}),
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
