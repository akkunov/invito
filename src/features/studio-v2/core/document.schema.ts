import { z } from "zod";

/** Studio v2 project contract. Independent of React, Next and the legacy InvitationDocument. */
const idSchema = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const sizeSchema = z.number().finite().min(1).max(20000);
const coordinateSchema = z.number().finite().min(-1_000_000).max(1_000_000);
const baseNodeSchema = z.strictObject({
  id: idSchema,
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
});
export const mediaAssetRefSchema = z.strictObject({
  id: idSchema,
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  name: z.string().min(1).max(200),
  sizeBytes: z.number().int().min(0).max(50_000_000),
  storageKey: z.string().min(1).max(400).regex(/^(?:\/images\/[a-zA-Z0-9_./-]+|local:[a-zA-Z0-9_-]+)$/).refine(key=>!key.includes(".."),"Unsafe asset path"),
  folder: z.string().max(80).optional(),
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
  id: idSchema,
  revision: z.number().int().min(0),
  locale: z.enum(["ru", "ky"]),
  pages: z.array(projectPageSchema).min(1).max(30),
  nodes: z.record(idSchema, nodeSchema).refine(value => Object.keys(value).length <= 500, "Maximum 500 nodes"),
  assets: z.record(idSchema, mediaAssetRefSchema).refine(value => Object.keys(value).length <= 200, "Maximum 200 assets"),
  components: z.record(idSchema,componentSchema).refine(v=>Object.keys(v).length<=100,"Maximum 100 components").optional(),
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
  const membership = new Map<string, number>();
  for (const [key, node] of Object.entries(doc.nodes)) {
    if (node.sizing) {
      const s = node.sizing;
      if ((s.minWidth ?? 1) > (s.maxWidth ?? 20000) || (s.minHeight ?? 1) > (s.maxHeight ?? 20000)) issue(["nodes", key, "sizing"], "Minimum exceeds maximum");
      if (node.type !== "frame" && (s.width === "hug" || s.height === "hug")) issue(["nodes", key, "sizing"], "Hug requires a frame");
      if (node.type === "frame" && node.layout === "free" && (s.width === "hug" || s.height === "hug")) issue(["nodes", key, "sizing"], "Hug requires auto layout");
      if (node.parentId === null && (s.width === "fill" || s.height === "fill")) issue(["nodes", key, "sizing"], "Page roots cannot fill");
    }
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
