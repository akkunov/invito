import { z } from "zod";

/** Restricted visual schema: no executable code, CSS injection, or arbitrary HTML. */
export const elementSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  type: z.enum(["text", "image", "shape", "button"]),
  x: z.number().finite().min(0).max(440),
  y: z.number().finite().min(0).max(2400),
  width: z.number().finite().min(24).max(440),
  height: z.number().finite().min(20).max(1000),
  text: z.string().max(300),
  binding: z.enum(["none","name1","name2","date","venue","message"]),
  fontSize: z.number().finite().min(8).max(120),
  fontFamily: z.enum(["sans","serif"]),
  fontWeight: z.enum(["400","500","600","700"]),
  italic: z.boolean().default(false),
  underline: z.boolean().default(false),
  strike: z.boolean().default(false),
  letterSpacing: z.number().finite().min(-4).max(20).default(0),
  shapeKind: z.enum(["rectangle","circle","ellipse","triangle","diamond","star","heart"]).default("rectangle"),
  textAlign: z.enum(["left","center","right"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  radius: z.number().finite().min(0).max(200),
  opacity: z.number().finite().min(0).max(1),
  imageSrc: z.string().max(750000).refine(value => !value || value.startsWith("/images/") || /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value),"Only built-in images or rasterized image files"),
});
export const studioTemplateSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]{3,64}$/),
  name: z.string().min(1).max(80),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  canvasHeight: z.number().int().min(500).max(2400),
  elements: z.array(elementSchema).min(0).max(80),
}).superRefine((value, ctx) => {
  const ids = new Set<string>();
  for (const [index, node] of value.elements.entries()) {
    if (ids.has(node.id)) ctx.addIssue({code:"custom", path:["elements",index,"id"], message:"Duplicate element ID"});
    ids.add(node.id);
    if (node.x + node.width > 440 || node.y + node.height > value.canvasHeight) {
      ctx.addIssue({code:"custom", path:["elements",index], message:"Element exceeds canvas bounds"});
    }
  }
});
export type StudioElement = z.infer<typeof elementSchema>;
export type StudioTemplate = z.infer<typeof studioTemplateSchema>;
export type StudioElementType = StudioElement["type"];

export function createElement(type: StudioElementType, id: string): StudioElement {
  const base: StudioElement = {
    id,type,x:50,y:160,width:340,height:75,text:"",
    binding:"none",fontSize:30,fontFamily:"serif",fontWeight:"400",textAlign:"center",
    color:"#34372F",background:"#E9E3D8",radius:0,opacity:1,imageSrc:"",italic:false,underline:false,strike:false,letterSpacing:0,shapeKind:"rectangle",
  };
  if(type==="text") return {...base,text:"Ваша история",background:"#F5F1E9",fontSize:36};
  if(type==="image") return {...base,y:250,height:310,imageSrc:"/images/riviera/couple.webp"};
  if(type==="button") return {...base,y:610,height:54,text:"Подтвердить участие",fontFamily:"sans",fontSize:15,background:"#3E493D",color:"#FFFFFF",radius:5,fontWeight:"600"};
  return {...base,y:420,width:200,height:70,background:"#D8D0C1"};
}

export const starterTemplate: StudioTemplate = {
  schemaVersion:1,id:"my-new-template",name:"Мой новый шаблон",background:"#F5F1E9",canvasHeight:920,
  elements:[
    {...createElement("text","intro"),x:40,y:58,width:360,height:25,text:"THE WEDDING OF",fontFamily:"sans",fontWeight:"600",fontSize:12},
    {...createElement("text","name-one"),x:25,y:100,width:390,height:68,text:"Анна",binding:"name1",fontSize:56},
    {...createElement("text","name-two"),x:25,y:175,width:390,height:68,text:"Максим",binding:"name2",fontSize:56},
    {...createElement("image","cover"),x:30,y:274,width:380,height:400},
    {...createElement("text","date"),x:50,y:710,width:340,height:44,text:"14 ИЮНЯ · 2027",binding:"date",fontSize:23},
    {...createElement("button","rsvp"),x:65,y:793,width:310,height:55}
  ]
};

export const demoBindings: Record<Exclude<StudioElement["binding"],"none">,string> = {
  name1:"Анна",name2:"Максим",date:"14 июня 2027",venue:"Усадьба «Сосны»",
  message:"Приглашаем вас разделить с нами особенный день."
};
