import assert from "node:assert/strict";
import {createEmptyProjectV2, parseProjectV2} from "../src/features/studio-v2/core/document.schema.ts";
import {
  applyStudioCommand, applyStudioBatch, createEditorSession, dispatchStudioCommand,
  beginStudioTransaction, commitStudioTransaction, cancelStudioTransaction, undoStudio, redoStudio
} from "../src/features/studio-v2/core/command-engine.ts";
import {createMemoryStudioPersistence, recoverStudioDocument, StudioRevisionConflict} from "../src/features/studio-v2/core/persistence.ts";

const fresh=createEmptyProjectV2("project-commands");
const frame=structuredClone(fresh.nodes["frame-1"]);
const textNode=(id,parentId="frame-1")=>({
  id,type:"text",parentId,x:25,y:40,width:450,height:90,rotation:0,opacity:1,visible:true,locked:false,
  runs:[{text:"Привет",style:{fontFamily:"serif",fontSize:64,fontWeight:400,italic:false,underline:false,strike:false,color:"#20242B"}}],
  textAlign:"center",bindingKey:null
});
let doc=applyStudioCommand(fresh,{kind:"insertNode",parentId:"frame-1",node:textNode("title-1")});
assert.equal(doc.nodes["title-1"].parentId,"frame-1");
assert.equal(fresh.nodes["title-1"],undefined,"input never mutated");
assert.deepEqual(doc.nodes["frame-1"].children,["title-1"]);
doc=applyStudioCommand(doc,{kind:"insertNode",parentId:"frame-1",node:textNode("title-2"),index:0});
assert.deepEqual(doc.nodes["frame-1"].children,["title-2","title-1"]);
doc=applyStudioCommand(doc,{kind:"reorderNode",id:"title-1",index:0});
assert.deepEqual(doc.nodes["frame-1"].children,["title-1","title-2"]);
doc=applyStudioCommand(doc,{kind:"updateNode",id:"title-1",changes:{opacity:.6}});
assert.equal(doc.nodes["title-1"].opacity,.6);
doc=applyStudioCommand(doc,{kind:"moveNodes",positions:{"title-1":{x:500,y:100},"title-2":{x:30,y:20}}});
assert.equal(doc.nodes["title-1"].x,500);
assert.equal(doc.nodes["title-2"].y,20);
doc=applyStudioCommand(doc,{kind:"insertNode",parentId:"frame-1",node:{...frame,id:"group-1",parentId:"frame-1",children:[]}});
doc=applyStudioCommand(doc,{kind:"reparentNode",id:"title-1",parentId:"group-1"});
assert.deepEqual(doc.nodes["group-1"].children,["title-1"]);
assert.ok(!doc.nodes["frame-1"].children.includes("title-1"));
doc=applyStudioCommand(doc,{kind:"duplicateNode",id:"group-1",newIds:{"group-1":"group-copy","title-1":"title-copy"}});
assert.equal(doc.nodes["title-copy"].parentId,"group-copy");
assert.deepEqual(doc.nodes["group-copy"].children,["title-copy"]);
doc=applyStudioCommand(doc,{kind:"deleteNode",id:"group-1"});
assert.equal(doc.nodes["group-1"],undefined);
assert.equal(doc.nodes["title-1"],undefined,"subtree delete cascades");

doc=applyStudioCommand(doc,{kind:"createPage",
 page:{id:"page-2",name:"RSVP",rootNodeId:"frame-2",placement:{x:2400,y:-500}},
 root:{...frame,id:"frame-2",children:[],name:"RSVP"}
});
assert.equal(doc.pages.length,2);
doc=applyStudioCommand(doc,{kind:"movePage",id:"page-2",placement:{x:-3400,y:750}});
assert.equal(doc.pages[1].placement.x,-3400);
doc=applyStudioCommand(doc,{kind:"renamePage",id:"page-2",name:"Благодарность"});
assert.equal(doc.pages[1].name,"Благодарность");
doc=applyStudioCommand(doc,{kind:"deletePage",id:"page-2"});
assert.equal(doc.pages.length,1);
assert.equal(doc.nodes["frame-2"],undefined);

const state=JSON.stringify(doc);
for(const bad of [
 {kind:"insertNode",parentId:"frame-1",node:textNode("title-2")},
 {kind:"deletePage",id:"page-1"},
 {kind:"updateNode",id:"frame-1",changes:{children:["untracked"]}},
 {kind:"moveNodes",positions:{"missing":{x:0,y:0}}},
 {kind:"reparentNode",id:"frame-1",parentId:"frame-1"},
 {kind:"duplicateNode",id:"title-2",newIds:{"title-2":"frame-1"}}
])assert.throws(()=>applyStudioCommand(doc,bad),undefined,`rejects invalid command ${bad.kind}`);
assert.equal(JSON.stringify(doc),state,"invalid commands do not mutate input");
assert.throws(()=>applyStudioBatch(doc,[
 {kind:"updateNode",id:"title-2",changes:{opacity:.8}},
 {kind:"deletePage",id:"page-1"}
]),"invalid batch atomic");
assert.equal(JSON.stringify(doc),state);

let session=createEditorSession(doc);
session=dispatchStudioCommand(session,[
 {kind:"moveNodes",positions:{"title-2":{x:70,y:100}}},
 {kind:"updateNode",id:"title-2",changes:{opacity:.3}}
]);
assert.equal(session.undoStack.length,1,"batch = one history step");
assert.equal(session.document.revision,1);
session=undoStudio(session);
assert.equal(session.document.nodes["title-2"].x,30);
assert.equal(session.document.revision,2,"undo revision never moves backwards");
session=redoStudio(session);
assert.equal(session.document.nodes["title-2"].x,70);
assert.equal(session.document.revision,3);
session=undoStudio(session);
session=dispatchStudioCommand(session,{kind:"moveNodes",positions:{"title-2":{x:5,y:3}}});
assert.equal(session.redoStack.length,0,"new edit clears redo");

session=beginStudioTransaction(session,"pointer gesture");
const original=session.document.nodes["title-2"].x;
const beforeHistory=session.undoStack.length;
session=dispatchStudioCommand(session,{kind:"moveNodes",positions:{"title-2":{x:200,y:5}}});
session=dispatchStudioCommand(session,{kind:"moveNodes",positions:{"title-2":{x:500,y:15}}});
session=commitStudioTransaction(session);
assert.equal(session.undoStack.length,beforeHistory+1,"drag = one undo");
assert.equal(session.document.revision,6,"one revision per completed gesture");
session=undoStudio(session);
assert.equal(session.document.nodes["title-2"].x,original,"undo whole drag");
session=beginStudioTransaction(session,"cancel gesture");
session=dispatchStudioCommand(session,{kind:"moveNodes",positions:{"title-2":{x:900,y:10}}});
session=cancelStudioTransaction(session);
assert.equal(session.document.nodes["title-2"].x,original);
assert.equal(session.transaction,null);
assert.throws(()=>commitStudioTransaction(session),"missing transaction");

const storage=createMemoryStudioPersistence();
await storage.save(fresh,null);
const restored=await recoverStudioDocument(storage,fresh.id);
assert.deepEqual(restored,fresh);
assert.notEqual(restored,fresh);
await storage.save({...fresh,revision:1},0);
await assert.rejects(()=>storage.save({...fresh,revision:2},0),StudioRevisionConflict);
await assert.rejects(()=>storage.save({...fresh,revision:1},1),StudioRevisionConflict);
const last=await recoverStudioDocument(storage,fresh.id);
assert.equal(last.revision,1);
assert.ok(parseProjectV2(doc));
console.log("PASS Studio v2 commands: atomic graph changes, batches, monotonic revisions, undo/redo, drag transactions, storage CAS");
