import { z } from "zod";
import {OVERRIDE_FIELDS} from "./linked-components.ts";
import {tokenSchema,tokenRefsSchema,themeSchema,compatibleToken,tokenSlots} from "./style-tokens.schema.ts";
import {motionSchema} from "./motion.schema.ts";
import {visualSchema} from "./appearance.schema.ts";
import {bindingKeySchema,bindingValueSchema,invitationBlockSchema,blockAppearanceSchema} from "./invitation.schema.ts";

/** Studio v2 project contract. Independent of React, Next and the legacy InvitationDocument. */
const idSchema = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const sizeSchema = z.number().finite().min(1).max(20000);
const coordinateSchema = z.number().finite().min(-1_000_000).max(1_000_000);
export const studioDevices = ["desktop","tablet","mobile"] as const;
export const responsivePatchSchema = z.strictObject({
  x:coordinateSchema.optional(),y:coordinateSchema.optional(),width:sizeSchema.optional(),height:sizeSchema.optional(),visible:z.boolean().optional(),opacity:z.number().finite().min(0).max(1).optional(),rotation:z.number().finite().min(-360).max(360).optional(),
  textStyle:z.strictObject({fontSize:z.number().finite().min(6).max(400).optional(),lineHeight:z.number().finite().min(.8).max(4).optional(),letterSpacing:z.number().finite().min(-10).max(60).optional(),textAlign:z.enum(["left","center","right"]).optional()}).optional(),
  frameLayout:z.strictObject({layout:z.enum(["free","vertical","horizontal"]).optional(),gap:z.number().finite().min(0).max(2000).optional(),alignment:z.enum(["start","center","end"]).optional(),distribution:z.enum(["start","center","end","space-between"]).optional(),padding:z.strictObject({top:z.number().finite().min(0).max(2000),right:z.number().finite().min(0).max(2000),bottom:z.number().finite().min(0).max(2000),left:z.number().finite().min(0).max(2000)}).optional()}).optional()
});
const baseNodeSchema = z.strictObject({
  id: idSchema,
  layerName: z.string().min(1).max(100).optional(),
  visual: visualSchema.optional(),
  tokenRefs: tokenRefsSchema.optional(),
  motion: motionSchema.optional(),
  parentId: idSchema.nullable(),
  x: coordinateSchema,
  y: coordinateSchema,
  width: sizeSchema,
  height: sizeSchema,
  rotation: z.number().finite().min(-360).max(360),
  opacity: z.number().finite().min(0).max(1),
  visible: z.boolean(),
  locked: z.boolean(),
  sizing: z.strictObject({ width: z.enum(["fixed","fill","hug"]), height: z.enum(["fixed","fill","hug"]), minWidth: sizeSchema.optional(), maxWidth: sizeSchema.optional(), minHeight: sizeSchema.optional(), maxHeight: sizeSchema.optional() }).optional(),
  componentSourceId: idSchema.optional(),
  componentOverrides: z.array(z.enum(OVERRIDE_FIELDS)).max(OVERRIDE_FIELDS.length).refine(v=>new Set(v).size===v.length,"Duplicate override field").optional(),
  componentRef: z.strictObject({componentId:idSchema,variantId:idSchema}).optional(),
  anchors: z.strictObject({ x: z.enum(["start","center","end","stretch"]), y: z.enum(["start","center","end","stretch"]) }).optional(),
});
const paddingSchema = z.strictObject({
  top: z.number().finite().min(0).max(2000),
  right: z.number().finite().min(0).max(2000),
  bottom: z.number().finite().min(0).max(2000),
  left: z.number().finite().min(0).max(2000),
});
const richTextStyleSchema = z.strictObject({
  fontFamily: z.enum(["sans", "serif"]),
  fontSize: z.number().finite().min(6).max(400),
  fontWeight: z.number().int().min(100).max(900),
  italic: z.boolean(),
  underline: z.boolean(),
  strike: z.boolean(),
  color: colorSchema,
});
const richTextRunSchema = z.strictObject({
  text: z.string().max(10000),
  style: richTextStyleSchema,
});
const nodeSchema = z.discriminatedUnion("type", [
  baseNodeSchema.extend({
    type: z.literal("frame"),
    name: z.string().min(1).max(100),
    children: z.array(idSchema).max(500),
    layout: z.enum(["free", "vertical", "horizontal"]),
    gap: z.number().finite().min(0).max(2000),
    alignment: z.enum(["start","center","end"]).optional(),
    distribution: z.enum(["start","center","end","space-between"]).optional(),
    padding: paddingSchema,
    background: z.union([colorSchema, z.literal("transparent")]),
    clip: z.boolean(),
  }),
  baseNodeSchema.extend({
    type: z.literal("text"),
    runs: z.array(richTextRunSchema).min(1).max(1000),
    textAlign: z.enum(["left", "center", "right"]),
    lineHeight: z.number().finite().min(0.8).max(4).optional(),
    letterSpacing: z.number().finite().min(-10).max(60).optional(),
    autoHeight: z.boolean().optional(),
    dateFormat: z.enum(["date","numeric","weekday","time","date-time"]).optional(),
    bindingKey: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,99}$/).nullable(),
  }),
  baseNodeSchema.extend({
    type: z.literal("image"),
    assetId: idSchema,
    fit: z.enum(["cover", "contain"]),
    focalX: z.number().finite().min(0).max(1),
    focalY: z.number().finite().min(0).max(1),
  }),
  baseNodeSchema.extend({
    type: z.literal("widget"),
    block: invitationBlockSchema,
    appearance: blockAppearanceSchema,
  }),
  baseNodeSchema.extend({
    type: z.literal("shape"),
    shape: z.enum(["rectangle", "circle", "ellipse", "triangle", "star", "heart"]),
    fill: colorSchema,
    stroke: colorSchema.nullable(),
    strokeWidth: z.number().finite().min(0).max(100),
  }),
]);
export const projectPageSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(100),
  rootNodeId: idSchema,
  placement: z.strictObject({ x: coordinateSchema, y: coordinateSchema }),
  responsive: z.strictObject({desktop:z.strictObject({width:sizeSchema,height:sizeSchema,mode:z.enum(["scale","reflow"])}).optional(),tablet:z.strictObject({width:sizeSchema,height:sizeSchema,mode:z.enum(["scale","reflow"])}).optional(),mobile:z.strictObject({width:sizeSchema,height:sizeSchema,mode:z.enum(["scale","reflow"])}).optional()}).optional(),
});
export const mediaAssetRefSchema = z.strictObject({
  id: idSchema,
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  name: z.string().min(1).max(200),
  sizeBytes: z.number().int().min(0).max(50_000_000),
  storageKey: z.string().min(1).max(400).regex(/^(?:\/images\/[a-zA-Z0-9_./-]+|local:[a-zA-Z0-9_-]+|asset:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/).refine(key=>!key.includes(".."),"Unsafe asset path"),
  folder: z.string().max(80).optional(),
  decorative: z.boolean().optional(),
  pixelWidth: z.number().int().min(1).max(4096).optional(),
  pixelHeight: z.number().int().min(1).max(4096).optional(),
});
export const componentSchema = z.strictObject({id:idSchema,name:z.string().min(1).max(100),variants:z.array(z.strictObject({id:idSchema,name:z.string().min(1).max(100),rootId:idSchema,nodes:z.record(idSchema,nodeSchema)})).min(1).max(20)});
const variableSchema = z.strictObject({
  type: z.enum(["text", "date", "number", "boolean"]),
  label: z.strictObject({ ru: z.string().max(100), ky: z.string().max(100) }),
});
export const projectDocumentSchema = z.strictObject({
  schemaVersion: z.literal(2),
  presentation: z.enum(["editorial","heritage","gilded","alpine","felt","collection"]).optional(),
  id: idSchema,
  revision: z.number().int().min(0),
  locale: z.enum(["ru", "ky"]),
  pages: z.array(projectPageSchema).min(1).max(30),
  nodes: z.record(idSchema, nodeSchema).refine(value => Object.keys(value).length <= 500, "Maximum 500 nodes"),
  assets: z.record(idSchema, mediaAssetRefSchema).refine(value => Object.keys(value).length <= 200, "Maximum 200 assets"),
  responsiveOverrides: z.strictObject({desktop:z.record(idSchema,responsivePatchSchema).optional(),tablet:z.record(idSchema,responsivePatchSchema).optional(),mobile:z.record(idSchema,responsivePatchSchema).optional()}).optional(),
  tokens: z.record(idSchema,tokenSchema).refine(v=>Object.keys(v).length<=200,"Maximum 200 styles").optional(),
  themes: z.record(idSchema,themeSchema).refine(v=>Object.keys(v).length<=20,"Maximum 20 themes").optional(),
  activeThemeId: idSchema.nullable().optional(),
  components: z.record(idSchema,componentSchema).refine(v=>Object.keys(v).length<=100,"Maximum 100 components").optional(),
  guides: z.array(z.strictObject({id:idSchema,axis:z.enum(["x","y"]),position:coordinateSchema})).max(100).refine(v=>new Set(v.map(g=>g.id)).size===v.length,"Duplicate guide ID").optional(),
  values: z.record(bindingKeySchema,bindingValueSchema).refine(v=>Object.keys(v).length<=100,"Maximum 100 values").optional(),
  variables: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,99}$/), variableSchema),
}).superRefine((doc, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: "custom", path, message });

  const pageIds = new Set<string>();
  const rootIds = new Set<string>();
  for (const [index, page] of doc.pages.entries()) {
    if (pageIds.has(page.id)) issue(["pages", index, "id"], "Duplicate page ID");
    pageIds.add(page.id);
    if (rootIds.has(page.rootNodeId)) issue(["pages", index, "rootNodeId"], "Root frame is used by multiple pages");
    rootIds.add(page.rootNodeId);
    const root = doc.nodes[page.rootNodeId];
    if (!root || root.type !== "frame" || root.parentId !== null)
      issue(["pages", index, "rootNodeId"], "Page must reference an existing top-level frame");
  }
  for(const [device,overrides] of Object.entries(doc.responsiveOverrides??{}))for(const [id,patch] of Object.entries(overrides??{})){
    const node=doc.nodes[id],path=["responsiveOverrides",device,id];
    if(!node){issue(path,"Override must reference an existing node");continue;}
    if(rootIds.has(id)&&Object.keys(patch).some(key=>key!=="frameLayout"))issue(path,"Page root geometry uses page profiles");
    if(patch.textStyle&&node.type!=="text")issue(path,"Text override requires text layer");
    if(patch.frameLayout&&node.type!=="frame")issue(path,"Layout override requires frame");
  }
  for(const [key,value] of Object.entries(doc.values??{}))if(doc.variables[key]?.type!==value.type)issue(["values",key],"Variable type mismatch or missing declaration");
  const validateWidget=(node:z.infer<typeof nodeSchema>,path:(string|number)[])=>{
    if(node.type!=="widget")return;
    const b=node.block;
    if(b.kind==="gallery")for(const id of b.assetIds)if(!doc.assets[id])issue(path,"Missing gallery asset");
    if(b.kind==="calendar"&&b.targetKey&&doc.variables[b.targetKey]?.type!=="date")issue(path,"Calendar requires date variable");
    if(b.kind==="countdown"&&b.targetKey&&doc.variables[b.targetKey]?.type!=="date")issue(path,"Countdown requires date variable");
    if(b.kind==="location"&&b.addressKey&&doc.variables[b.addressKey]?.type!=="text")issue(path,"Location requires text variable");
  };
  for(const [id,token] of Object.entries(doc.tokens??{}))if(id!==token.id)issue(["tokens",id],"Style key mismatch");
  for(const [id,theme] of Object.entries(doc.themes??{})){
    if(id!==theme.id)issue(["themes",id],"Theme key mismatch");
    for(const [key,override] of Object.entries(theme.overrides)){
      const base=doc.tokens?.[key];if(!base||override.id!==key||base.kind!==override.kind)issue(["themes",id,"overrides",key],"Theme override must match a base style");
    }
  }
  if(doc.activeThemeId&&!doc.themes?.[doc.activeThemeId])issue(["activeThemeId"],"Missing theme");
  const validateTokens=(node:z.infer<typeof nodeSchema>,path:(string|number)[])=>{
    for(const slot of tokenSlots){
      const id=node.tokenRefs?.[slot];if(!id)continue;
      const token=doc.tokens?.[id];if(!token||!compatibleToken(slot,token))issue([...path,"tokenRefs",slot],"Missing or incompatible style");
      if((slot==="typography"||slot==="textColor")&&node.type!=="text")issue([...path,"tokenRefs",slot],"Text styles require a text layer");
    }
  };
  const membership = new Map<string, number>();
  for (const [key, node] of Object.entries(doc.nodes)) {
    validateWidget(node,["nodes",key,"block"]);
    validateTokens(node,["nodes",key]);
    if (node.sizing) {
      const s = node.sizing;
      if ((s.minWidth ?? 1) > (s.maxWidth ?? 20000) || (s.minHeight ?? 1) > (s.maxHeight ?? 20000)) issue(["nodes", key, "sizing"], "Minimum exceeds maximum");
      if (node.type !== "frame" && (s.width === "hug" || s.height === "hug")) issue(["nodes", key, "sizing"], "Hug requires a frame");
      if (node.type === "frame" && node.layout === "free" && (s.width === "hug" || s.height === "hug")) issue(["nodes", key, "sizing"], "Hug requires auto layout");
      if (node.parentId === null && (s.width === "fill" || s.height === "fill")) issue(["nodes", key, "sizing"], "Page roots cannot fill");
    }
    if(node.componentRef&&!doc.components?.[node.componentRef.componentId]?.variants.some(v=>v.id===node.componentRef!.variantId))issue(["nodes",key,"componentRef"],"Missing component variant");
    if (key !== node.id) issue(["nodes", key, "id"], "Node key and ID differ");
    if (rootIds.has(key) && node.parentId !== null)
      issue(["nodes", key, "parentId"], "Root frame must have no parent");
    if (!rootIds.has(key) && node.parentId === null)
      issue(["nodes", key, "parentId"], "Only page roots may have no parent");
    if (node.parentId !== null && doc.nodes[node.parentId]?.type !== "frame")
      issue(["nodes", key, "parentId"], "Parent must be an existing frame");
    if (node.type === "image" && !doc.assets[node.assetId])
      issue(["nodes", key, "assetId"], "Referenced asset is missing");
    if (node.type === "text" && node.bindingKey && !doc.variables[node.bindingKey])
      issue(["nodes", key, "bindingKey"], "Referenced variable is missing");
    if (node.type === "frame") {
      const unique = new Set<string>();
      for (const [index, childId] of node.children.entries()) {
        if (unique.has(childId)) issue(["nodes", key, "children", index], "Duplicate child ID");
        unique.add(childId);
        const child = doc.nodes[childId];
        if (!child) issue(["nodes", key, "children", index], "Referenced child is missing");
        else if (child.parentId !== key)
          issue(["nodes", key, "children", index], "Child's parentId does not match frame");
        membership.set(childId, (membership.get(childId) ?? 0) + 1);
      }
    }
  }
  for (const key of Object.keys(doc.nodes)) {
    const count = membership.get(key) ?? 0;
    if (rootIds.has(key) ? count !== 0 : count !== 1)
      issue(["nodes", key], "Every non-root node must appear in exactly one parent frame");
  }
  // Iterative DFS avoids recursion limits and rejects cycles / disconnected subtrees.
  const visited = new Set<string>();
  const queue = Array.from(rootIds);
  while (queue.length > 0) {
    const next = queue.pop()!;
    if (visited.has(next)) { issue(["nodes", next], "Cycle or repeated reference"); continue; }
    visited.add(next);
    const node = doc.nodes[next];
    if (node?.type === "frame") queue.push(...node.children);
  }
  if (visited.size !== Object.keys(doc.nodes).length)
    issue(["nodes"], "All nodes must be reachable from a page root");
  for(const [key,component] of Object.entries(doc.components??{})){
    if(key!==component.id)issue(["components",key],"Component ID mismatch");
    const variants=new Set<string>();
    for(const variant of component.variants){
      const path=["components",key,"variants",variant.id];
      if(variants.has(variant.id))issue(path,"Duplicate variant");
      variants.add(variant.id);
      const root=variant.nodes[variant.rootId];
      if(!root||root.parentId!==null||Object.keys(variant.nodes).length>500)issue(path,"Invalid component root or size");
      const visited=new Set<string>(),queue=[variant.rootId];
      while(queue.length){
        const id=queue.pop()!,n=variant.nodes[id];
        if(!n||visited.has(id)){issue(path,"Broken or cyclic component tree");continue;}
        visited.add(id);
        if(n.id!==id)issue(path,"Node ID mismatch");
        validateWidget(n,path);
        validateTokens(n,path);
        if(n.componentRef||n.componentSourceId||n.componentOverrides)issue(path,"Component definitions must be detached snapshots");
        if(n.type==="image"&&!doc.assets[n.assetId])issue(path,"Missing component asset");
        if(n.type==="text"&&n.bindingKey&&!doc.variables[n.bindingKey])issue(path,"Missing component variable");
        if(n.type==="frame")for(const child of n.children){
          if(variant.nodes[child]?.parentId!==id)issue(path,"Component parent mismatch");
          queue.push(child);
        }
      }
      if(visited.size!==Object.keys(variant.nodes).length)issue(path,"Disconnected component nodes");
    }
  }
  // Linked instances are exact materialized trees with stable source keys.
  // A legacy root without a source key remains an independent snapshot.
  const linkedMembers=new Set<string>();
  for(const root of Object.values(doc.nodes)){
    if(!root.componentRef||!root.componentSourceId)continue;
    const path=["nodes",root.id,"componentRef"];
    const v=doc.components?.[root.componentRef.componentId]?.variants.find(v=>v.id===root.componentRef!.variantId);
    if(!v||root.componentSourceId!==v.rootId||root.parentId===null){issue(path,"Invalid linked instance root");continue;}
    const queue:[string,string][]=[[root.id,v.rootId]],seen=new Set<string>();
    while(queue.length){
      const [id,sourceId]=queue.pop()!,node=doc.nodes[id],source=v.nodes[sourceId];
      if(!node||!source||seen.has(id)||linkedMembers.has(id)){issue(path,"Invalid or nested linked tree");continue;}
      seen.add(id);linkedMembers.add(id);
      if(node.componentSourceId!==sourceId||node.type!==source.type||id!==root.id&&node.componentRef)issue(path,"Linked member does not match master");
      if(id===root.id&&node.componentOverrides?.some(k=>["x","y","rotation"].includes(k)))issue(path,"Instance placement is not an override field");
      if(node.type==="frame"&&source.type==="frame"){
        if(node.children.length!==source.children.length)issue(path,"Detach instance before changing its structure");
        else node.children.forEach((child,i)=>queue.push([child,source.children[i]]));
      }
    }
  }
  for(const node of Object.values(doc.nodes))if((node.componentSourceId||node.componentOverrides)&&!linkedMembers.has(node.id))issue(["nodes",node.id],"Orphan linked component metadata");
  for (const [key, asset] of Object.entries(doc.assets)) {
    if (key !== asset.id) issue(["assets", key, "id"], "Asset key and ID differ");
  }
});
export type ProjectDocumentV2 = z.infer<typeof projectDocumentSchema>;
export type ProjectNodeV2 = ProjectDocumentV2["nodes"][string];
export type StudioPageV2 = ProjectDocumentV2["pages"][number];

export function createEmptyProjectV2(id: string, locale: "ru" | "ky" = "ru"): ProjectDocumentV2 {
  const project = {
    schemaVersion: 2 as const, id, revision: 0, locale,
    pages: [{
      id: "page-1", name: locale === "ru" ? "Обложка" : "Мукаба",
      rootNodeId: "frame-1", placement: { x: 0, y: 0 },
    }],
    nodes: {
      "frame-1": {
        id: "frame-1", type: "frame" as const, parentId: null,
        x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 1,
        visible: true, locked: false, name: "Обложка", children: [],
        layout: "free" as const, gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        background: "#FFFFFF", clip: true,
      },
    },
    assets: {},
    variables: {},
  };
  return projectDocumentSchema.parse(project);
}

export function parseProjectV2(input: unknown): ProjectDocumentV2 {
  return projectDocumentSchema.parse(input);
}

/** v1 documents are intentionally rejected here; migration must be explicit. */
export function isProjectV2(input: unknown): input is ProjectDocumentV2 {
  return projectDocumentSchema.safeParse(input).success;
}
