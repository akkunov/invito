import {unlinkStyle,styleUsage} from "./style-tokens.ts";
import type {StyleToken,StyleTheme,TokenSlot} from "./style-tokens.schema.ts";
import {compatibleToken} from "./style-tokens.schema.ts";
import {linkedRoot,stripLink,updateComponentDefinition,reconcileInstance,resetNodeOverrides,detachInstance,noteOverrides} from "./linked-components.ts";
import type {Device,PageProfile,NodeOverride} from "./responsive-engine.ts";
import { resolveLayout } from "./layout-engine.ts";
import { parseProjectV2, type ProjectDocumentV2, type ProjectNodeV2, type StudioPageV2 } from "./document.schema.ts";

type FrameNode = Extract<ProjectNodeV2, { type: "frame" }>;
type Position = { x: number; y: number };
type EditableNodeFields = ProjectNodeV2 extends infer N ? N extends ProjectNodeV2 ? Partial<Omit<N, "id" | "type" | "parentId" | "children">> : never : never;

export type StudioCommand =
  | {kind:"putStyleToken";token:StyleToken}
  | {kind:"deleteStyleToken";id:string}
  | {kind:"putStyleTheme";theme:StyleTheme}
  | {kind:"deleteStyleTheme";id:string}
  | {kind:"activateStyleTheme";id:string|null}
  | {kind:"bindStyle";id:string;slot:TokenSlot;tokenId:string|null}
  | { kind: "putVariable"; key: string; variable: ProjectDocumentV2["variables"][string]; value: NonNullable<ProjectDocumentV2["values"]>[string] }
  | { kind: "setVariableValue"; key: string; value: NonNullable<ProjectDocumentV2["values"]>[string] }
  | { kind: "setPageProfile"; id: string; device: Device; profile: PageProfile | null }
  | { kind: "setResponsiveOverride"; id: string; device: Device; patch: NodeOverride | null }
  | { kind: "putAsset"; asset: ProjectDocumentV2["assets"][string] }
  | { kind: "deleteAsset"; id: string }
  | { kind: "switchComponentVariant"; id:string; variantId:string }
  | { kind: "resetComponentOverrides"; id:string; scope:"layer"|"instance" }
  | { kind: "detachComponent"; id:string }
  | { kind: "putComponent"; component: NonNullable<ProjectDocumentV2["components"]>[string] }
  | { kind: "deleteComponent"; id: string }
  | { kind: "setLayerState"; id:string; locked?:boolean; visible?:boolean }
  | { kind: "reorderPage"; id:string; index:number }
  | { kind: "setGuides"; guides: NonNullable<ProjectDocumentV2["guides"]> }
  | { kind: "pasteNodes"; parentId: string; nodes: ProjectDocumentV2["nodes"]; roots: string[]; overrides: NonNullable<ProjectDocumentV2["responsiveOverrides"]> }
  | { kind: "insertNode"; parentId: string; node: ProjectNodeV2; index?: number }
  | { kind: "updateNode"; id: string; changes: EditableNodeFields }
  | { kind: "moveNodes"; positions: Record<string, Position> }
  | { kind: "reparentNode"; id: string; parentId: string; index?: number }
  | { kind: "reorderNode"; id: string; index: number }
  | { kind: "deleteNode"; id: string }
  | { kind: "duplicateNode"; id: string; newIds: Record<string, string>; index?: number }
  | { kind: "createPage"; page: StudioPageV2; root: FrameNode; index?: number }
  | { kind: "movePage"; id: string; placement: Position }
  | { kind: "renamePage"; id: string; name: string }
  | { kind: "deletePage"; id: string };

export type StudioEditorSession = {
  document: ProjectDocumentV2;
  undoStack: ProjectDocumentV2[];
  redoStack: ProjectDocumentV2[];
  transaction: { before: ProjectDocumentV2; label: string } | null;
};
export const HISTORY_LIMIT = 50;
const clone = <T,>(data: T): T => structuredClone(data);
const equalContent = (a: ProjectDocumentV2, b: ProjectDocumentV2): boolean => {
  const x = { ...a, revision: 0 };
  const y = { ...b, revision: 0 };
  return JSON.stringify(x) === JSON.stringify(y);
};
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
};
function getNode(doc: ProjectDocumentV2, id: string): ProjectNodeV2 {
  const node = doc.nodes[id];
  if (!node) throw new Error("Node not found: " + id);
  return node;
}
function getFrame(doc: ProjectDocumentV2, id: string): FrameNode {
  const node = getNode(doc, id);
  if (node.type !== "frame") throw new Error("Parent must be a frame: " + id);
  return node;
}
function isRoot(doc: ProjectDocumentV2, id: string) {
  return doc.pages.some(page => page.rootNodeId === id);
}
function ensureWritable(doc: ProjectDocumentV2, id: string) {
  const seen = new Set<string>();
  let current: string | null = id;
  while (current !== null) {
    if (seen.has(current)) throw new Error("Parent cycle detected");
    seen.add(current);
    const node = getNode(doc, current);
    if (node.locked) throw new Error("Locked node cannot be edited: " + current);
    current = node.parentId;
  }
}
function insertAt<T>(array: T[], item: T, index?: number) {
  const i = index ?? array.length;
  if (!Number.isInteger(i) || i < 0 || i > array.length) throw new Error("Invalid insertion index");
  array.splice(i, 0, item);
}
function subtreeIds(doc: ProjectDocumentV2, rootId: string): string[] {
  const ids: string[] = [];
  const stack = [rootId];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) throw new Error("Duplicate or cyclic node reference");
    seen.add(id);
    const node = getNode(doc, id);
    ids.push(id);
    if (node.type === "frame") stack.push(...node.children);
  }
  return ids;
}
function removeSubtree(doc: ProjectDocumentV2, id: string) {
  const node = getNode(doc, id);
  if (node.parentId) {
    const parent = getFrame(doc, node.parentId);
    parent.children = parent.children.filter(value => value !== id);
  }
  for (const nodeId of subtreeIds(doc, id)) {delete doc.nodes[nodeId];for(const map of Object.values(doc.responsiveOverrides??{}))if(map)delete map[nodeId];}
}
function executeUnsafe(doc: ProjectDocumentV2, command: StudioCommand) {
  switch (command.kind) {
    case "putStyleToken": {
      const old=doc.tokens?.[command.token.id];assert(!old||old.kind===command.token.kind,"Cannot change style type");
      doc.tokens??={};doc.tokens[command.token.id]=clone(command.token);return;
    }
    case "deleteStyleToken": {
      assert(doc.tokens?.[command.id],"Missing style");assert(!styleUsage(doc,command.id),"Style is in use");
      delete doc.tokens![command.id];for(const theme of Object.values(doc.themes??{}))delete theme.overrides[command.id];return;
    }
    case "putStyleTheme": {doc.themes??={};doc.themes[command.theme.id]=clone(command.theme);return;}
    case "deleteStyleTheme": {assert(doc.themes?.[command.id],"Missing theme");delete doc.themes![command.id];if(doc.activeThemeId===command.id)doc.activeThemeId=null;return;}
    case "activateStyleTheme": {assert(command.id===null||doc.themes?.[command.id],"Missing theme");doc.activeThemeId=command.id;return;}
    case "bindStyle": {
      const n=getNode(doc,command.id);ensureWritable(doc,n.id);
      if(command.tokenId===null){doc.nodes[n.id]=unlinkStyle(doc,n,command.slot);return;}
      const token=doc.tokens?.[command.tokenId];assert(token&&compatibleToken(command.slot,token),"Incompatible style");
      n.tokenRefs={...n.tokenRefs,[command.slot]:command.tokenId};return;
    }
    case "putVariable": { assert(!doc.variables[command.key],"Variable already exists");doc.variables[command.key]=clone(command.variable);doc.values??={};doc.values[command.key]=clone(command.value);return; }
    case "setVariableValue": { assert(doc.variables[command.key],"Unknown variable");doc.values??={};doc.values[command.key]=clone(command.value);return; }
    case "setPageProfile": { const page=doc.pages.find(p=>p.id===command.id);assert(page,"Missing page");ensureWritable(doc,page.rootNodeId);page.responsive??={};if(command.profile)page.responsive[command.device]=clone(command.profile);else delete page.responsive[command.device];return; }
    case "setResponsiveOverride": { const n=getNode(doc,command.id);ensureWritable(doc,n.id);assert(n.parentId!==null,"Use page profile for root");doc.responsiveOverrides??={};const map=doc.responsiveOverrides[command.device]??={};doc.responsiveOverrides[command.device]=map;if(command.patch){const clean=Object.fromEntries(Object.entries(command.patch).filter(([,value])=>value!==undefined));if(Object.keys(clean).length)map[n.id]=clone(clean);else delete map[n.id];}else delete map[n.id];return; }
    case "putAsset": { doc.assets[command.asset.id]=clone(command.asset); return; }
    case "deleteAsset": { assert(doc.assets[command.id],"Missing asset");delete doc.assets[command.id];return; }
    case "putComponent": { updateComponentDefinition(doc,command.component);return; }
    case "switchComponentVariant": {
      const root=linkedRoot(doc,command.id);assert(root?.componentRef,"Select a linked instance");ensureWritable(doc,root.parentId!);
      const component=doc.components?.[root.componentRef.componentId];const variant=component?.variants.find(v=>v.id===command.variantId);assert(component&&variant,"Unknown variant");reconcileInstance(doc,root.id,variant,component.id);return;
    }
    case "resetComponentOverrides": {
      const root=linkedRoot(doc,command.id);assert(root?.componentRef,"Select a linked instance");ensureWritable(doc,root.parentId!);
      if(command.scope==="layer"){resetNodeOverrides(doc,command.id);return;}
      const component=doc.components?.[root.componentRef.componentId];const variant=component?.variants.find(v=>v.id===root.componentRef!.variantId);assert(component&&variant,"Missing variant");reconcileInstance(doc,root.id,variant,component.id,true);return;
    }
    case "detachComponent": { const root=linkedRoot(doc,command.id)??getNode(doc,command.id);assert(root.parentId,"Cannot detach page root");ensureWritable(doc,root.parentId);detachInstance(doc,root.id);return; }
    case "deleteComponent": { assert(doc.components?.[command.id],"Missing component");delete doc.components![command.id];return; }
    case "setLayerState": { const n=getNode(doc,command.id);assert(n.parentId!==null,"Use page controls for root");ensureWritable(doc,n.parentId);if(command.locked!==undefined)n.locked=command.locked;if(command.visible!==undefined)n.visible=command.visible;return; }
    case "reorderPage": { const i=doc.pages.findIndex(p=>p.id===command.id);assert(i>=0,"Page not found");assert(Number.isInteger(command.index)&&command.index>=0&&command.index<doc.pages.length,"Invalid page index");ensureWritable(doc,doc.pages[i].rootNodeId);const [page]=doc.pages.splice(i,1);doc.pages.splice(command.index,0,page);return; }
    case "setGuides": { doc.guides=clone(command.guides);return; }
    case "pasteNodes": {
      const parent=getFrame(doc,command.parentId);ensureWritable(doc,parent.id);
      const keys=Object.keys(command.nodes),rootSet=new Set(command.roots);
      assert(keys.length>0&&rootSet.size===command.roots.length&&command.roots.length>0,"Invalid clipboard roots");
      assert(keys.every(id=>!Object.hasOwn(doc.nodes,id)&&command.nodes[id].id===id),"Clipboard ID collision");
      assert(command.roots.every(id=>Object.hasOwn(command.nodes,id)&&command.nodes[id].parentId===parent.id),"Invalid clipboard root");
      for(const id of keys){const n=command.nodes[id];assert(rootSet.has(id)||n.parentId!==null&&Object.hasOwn(command.nodes,n.parentId),"Clipboard cannot modify existing tree");if(n.type==="frame")assert(n.children.every(child=>Object.hasOwn(command.nodes,child)),"Clipboard child outside tree");}
      Object.assign(doc.nodes,clone(command.nodes));parent.children.push(...command.roots);
      for(const device of ["desktop","tablet","mobile"] as const){const map=command.overrides[device];if(!map)continue;assert(Object.keys(map).every(id=>Object.hasOwn(command.nodes,id)),"Override outside clipboard");doc.responsiveOverrides??={};doc.responsiveOverrides[device]={...doc.responsiveOverrides[device],...clone(map)};}
      // A clipboard can outlive a master edit; refresh linked copies before validation.
      for(const id of keys){const node=doc.nodes[id];if(node?.componentRef&&node.componentSourceId){
        const component=doc.components?.[node.componentRef.componentId],variant=component?.variants.find(v=>v.id===node.componentRef!.variantId);
        assert(component&&variant,"Clipboard master variant no longer exists");
        reconcileInstance(doc,id,variant,component.id);
      }}
      return;
    }
    case "insertNode": {
      const parent = getFrame(doc, command.parentId);
      ensureWritable(doc, command.parentId);
      assert(!doc.nodes[command.node.id], "Node ID already exists");
      assert(command.node.parentId === command.parentId, "Node parentId mismatch");
      assert(command.node.type !== "frame" || command.node.children.length === 0, "Insert frame must start empty");
      insertAt(parent.children, command.node.id, command.index);
      doc.nodes[command.node.id] = clone(command.node);
      return;
    }
    case "updateNode": {
      const node = getNode(doc, command.id);
      ensureWritable(doc, command.id);
      const blocked = ["id", "type", "parentId", "children","componentSourceId","componentOverrides",...(node.componentSourceId?["componentRef"]:[])];
      assert(!Object.keys(command.changes).some(key => blocked.includes(key)), "Use structural commands to edit graph topology");
      // Preserve resolved placement when leaving a stack; free anchors are re-based
      // whenever the authored parent size changes.
      const geometry = node.type === "frame" ? resolveLayout(doc) : null;
      const updated = { ...node, ...clone(command.changes) } as ProjectNodeV2;
      if(node.type==="frame" && updated.type==="frame" && geometry){
        if(node.layout!=="free" && updated.layout==="free"){
          for(const id of node.children){const rect=geometry[id];if(rect){const child=doc.nodes[id];Object.assign(child,rect);}}
          if(updated.sizing)updated.sizing={...updated.sizing,width:updated.sizing.width==="hug"?"fixed":updated.sizing.width,height:updated.sizing.height==="hug"?"fixed":updated.sizing.height};
          if(!("width" in command.changes))updated.width=geometry[node.id].width;
          if(!("height" in command.changes))updated.height=geometry[node.id].height;
        }
        if(node.layout==="free" && updated.layout==="free"){
          for(const id of node.children){
            const child=doc.nodes[id],dx=updated.width-node.width,dy=updated.height-node.height;
            if(!dx&&!dy)continue;
            for(const [axis,delta,pos,min,max] of [["width",dx,"x","minWidth","maxWidth"],["height",dy,"y","minHeight","maxHeight"]] as const){
              const anchor=child.anchors?.[pos]??"start",old=child[axis];
              if(anchor==="stretch"&&child.sizing?.[axis]!=="fill")child[axis]=Math.max(child.sizing?.[min]??1,Math.min(child.sizing?.[max]??20000,old+delta));
              if(anchor==="center"||anchor==="end")child[pos]=Math.max(-1e6,Math.min(1e6,child[pos]+(delta-(child[axis]-old))*(anchor==="center"?0.5:1)));
            }
          }
        }
      }
      doc.nodes[command.id] = updated;
      return;
    }
    case "moveNodes": {
      for (const id of Object.keys(command.positions)) ensureWritable(doc, id);
      for (const [id, position] of Object.entries(command.positions)) {
        const node = getNode(doc, id);
        node.x = position.x;
        node.y = position.y;
      }
      return;
    }
    case "reparentNode": {
      const node = getNode(doc, command.id);
      assert(node.parentId !== null, "Cannot reparent a page root");
      ensureWritable(doc, command.id);
      ensureWritable(doc, command.parentId);
      assert(!subtreeIds(doc, node.id).includes(command.parentId), "Cannot reparent into own subtree");
      const previous = getFrame(doc, node.parentId);
      const target = getFrame(doc, command.parentId);
      previous.children = previous.children.filter(id => id !== node.id);
      insertAt(target.children, node.id, command.index);
      node.parentId = target.id;
      return;
    }
    case "reorderNode": {
      const node = getNode(doc, command.id);
      assert(node.parentId !== null, "Reorder page roots using pages");
      ensureWritable(doc, command.id);
      const parent = getFrame(doc, node.parentId);
      assert(Number.isInteger(command.index) && command.index >= 0 && command.index < parent.children.length, "Invalid reorder index");
      parent.children = parent.children.filter(id => id !== node.id);
      parent.children.splice(command.index, 0, node.id);
      return;
    }
    case "deleteNode": {
      const node = getNode(doc, command.id);
      assert(node.parentId !== null && !isRoot(doc, node.id), "Cannot delete page root; use deletePage");
      ensureWritable(doc, command.id);
      removeSubtree(doc, node.id);
      return;
    }
    case "duplicateNode": {
      const node = getNode(doc, command.id);
      assert(node.parentId !== null, "Duplicate a page root through createPage");
      ensureWritable(doc, node.id);
      const originals = subtreeIds(doc, node.id);
      assert(Object.keys(command.newIds).length === originals.length, "One new ID is required for each descendant");
      const ids = originals.map(id => {
        const newId = command.newIds[id];
        assert(typeof newId === "string" && !!newId, "Missing clone ID: " + id);
        assert(!doc.nodes[newId], "Clone ID already exists: " + newId);
        return newId;
      });
      assert(new Set(ids).size === ids.length, "Clone IDs must be unique");
      const parent = getFrame(doc, node.parentId);
      const partialLinked=!!node.componentSourceId&&!node.componentRef;
      for (const originalId of originals) {
        const original = getNode(doc, originalId);
        const duplicate = clone(original);
        if(partialLinked)stripLink(duplicate);
        duplicate.id = command.newIds[originalId];
        duplicate.parentId = originalId === node.id ? parent.id : command.newIds[original.parentId!];
        if (duplicate.type === "frame") duplicate.children = duplicate.children.map(id => command.newIds[id]);
        doc.nodes[duplicate.id] = duplicate;
        for(const overrides of Object.values(doc.responsiveOverrides??{}))if(overrides?.[originalId])overrides[duplicate.id]=clone(overrides[originalId]);
      }
      const baseIndex = parent.children.indexOf(node.id);
      insertAt(parent.children, command.newIds[node.id], command.index ?? baseIndex + 1);
      return;
    }
    case "createPage": {
      assert(!doc.pages.some(page => page.id === command.page.id), "Page ID already exists");
      assert(!doc.nodes[command.root.id], "Root node ID already exists");
      assert(command.page.rootNodeId === command.root.id, "Root/page ID mismatch");
      assert(command.root.parentId === null && command.root.children.length === 0, "New page root must be empty");
      doc.nodes[command.root.id] = clone(command.root);
      insertAt(doc.pages, clone(command.page), command.index);
      return;
    }
    case "movePage": {
      const page = doc.pages.find(page => page.id === command.id);
      assert(page, "Page not found");
      ensureWritable(doc, page.rootNodeId);
      page.placement = clone(command.placement);
      return;
    }
    case "renamePage": {
      const page = doc.pages.find(page => page.id === command.id);
      assert(page, "Page not found");
      ensureWritable(doc, page.rootNodeId);
      page.name = command.name;
      return;
    }
    case "deletePage": {
      assert(doc.pages.length > 1, "Cannot delete the last page");
      const page = doc.pages.find(page => page.id === command.id);
      assert(page, "Page not found");
      ensureWritable(doc, page.rootNodeId);
      removeSubtree(doc, page.rootNodeId);
      doc.pages = doc.pages.filter(other => other.id !== command.id);
      return;
    }
  }
}

/** Pure and atomic. The input document is never mutated, including when a command fails. */
export function applyStudioCommand(document: ProjectDocumentV2, command: StudioCommand): ProjectDocumentV2 {
  const next = clone(document);
  executeUnsafe(next, command);
  if(command.kind==="updateNode"||command.kind==="moveNodes"||command.kind==="setLayerState"||command.kind==="bindStyle")noteOverrides(document,next);
  return parseProjectV2(next);
}
export function applyStudioBatch(document: ProjectDocumentV2, commands: readonly StudioCommand[]): ProjectDocumentV2 {
  let result = document;
  for (const command of commands) result = applyStudioCommand(result, command);
  return result;
}
export function createEditorSession(document: ProjectDocumentV2): StudioEditorSession {
  return { document: parseProjectV2(clone(document)), undoStack: [], redoStack: [], transaction: null };
}
const capped = (stack: ProjectDocumentV2[], document: ProjectDocumentV2) =>
  [...stack.slice(-(HISTORY_LIMIT - 1)), clone(document)];
function commit(session: StudioEditorSession, next: ProjectDocumentV2): StudioEditorSession {
  if (equalContent(session.document, next)) return session;
  return {
    ...session, document: { ...next, revision: session.document.revision + 1 },
    undoStack: capped(session.undoStack, session.document),
    redoStack: [],
  };
}
/** Single commands and batches count as one undo step; invalid batches leave session untouched. */
export function dispatchStudioCommand(session: StudioEditorSession, command: StudioCommand | readonly StudioCommand[]): StudioEditorSession {
  const commands = Array.isArray(command) ? command : [command];
  const next = applyStudioBatch(session.document, commands as readonly StudioCommand[]);
  if (session.transaction) return { ...session, document: next };
  return commit(session, next);
}
export function beginStudioTransaction(session: StudioEditorSession, label: string): StudioEditorSession {
  assert(session.transaction === null, "A transaction is already open");
  return { ...session, transaction: { before: clone(session.document), label } };
}
export function commitStudioTransaction(session: StudioEditorSession): StudioEditorSession {
  assert(session.transaction, "No open transaction");
  const original = session.transaction.before;
  if (equalContent(original, session.document)) return { ...session, transaction: null, document: original };
  return {
    ...session, transaction: null,
    document: { ...session.document, revision: original.revision + 1 },
    undoStack: capped(session.undoStack, original),
    redoStack: [],
  };
}
export function cancelStudioTransaction(session: StudioEditorSession): StudioEditorSession {
  assert(session.transaction, "No open transaction");
  return { ...session, document: clone(session.transaction.before), transaction: null };
}
export function undoStudio(session: StudioEditorSession): StudioEditorSession {
  assert(session.transaction === null, "Finish transaction before undo");
  if (session.undoStack.length === 0) return session;
  const target = session.undoStack[session.undoStack.length - 1];
  return {
    ...session,
    document: { ...clone(target), revision: session.document.revision + 1 },
    undoStack: session.undoStack.slice(0, -1),
    redoStack: capped(session.redoStack, session.document),
  };
}
export function redoStudio(session: StudioEditorSession): StudioEditorSession {
  assert(session.transaction === null, "Finish transaction before redo");
  if (session.redoStack.length === 0) return session;
  const target = session.redoStack[session.redoStack.length - 1];
  return {
    ...session,
    document: { ...clone(target), revision: session.document.revision + 1 },
    undoStack: capped(session.undoStack, session.document),
    redoStack: session.redoStack.slice(0, -1),
  };
}
