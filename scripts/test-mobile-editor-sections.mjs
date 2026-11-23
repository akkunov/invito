import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {test} from "node:test";
import {personalizeDocument} from "../src/features/studio-v2/core/personalization.ts";
import {personalizationPatchSchema} from "../src/features/studio-v2/core/personalization.schema.ts";

const read=(version)=>JSON.parse(readFileSync(
  fileURLToPath(new URL("../templates/packages/editorial-ivory."+version+".json",import.meta.url)),"utf8"));
const source=read("v3");

test("legacy personalization patches remain backward compatible",()=>{
  assert.deepEqual(personalizationPatchSchema.parse({values:{}}),{values:{}});
  assert.equal(personalizeDocument(source.document,source.personalization,{values:{}}).pages.length,6);
});

test("approved optional pages may hide and reorder without deleting the content",()=>{
  const patch={values:{},sections:{
    order:["cover","memories","details","program","letter","rsvpPage"],
    hidden:["program"],
  }};
  const document=personalizeDocument(source.document,source.personalization,patch);
  assert.equal(document.pages[1].id,"memories");
  assert.equal(document.pages[4].id,"letter");
  assert.equal(document.nodes.programRoot.visible,false);
  assert.equal(source.document.nodes.programRoot.visible,true);
  assert.equal(document.pages.length,6);
});

test("protected cover and RSVP cannot be hidden or moved",()=>{
  const correct=source.document.pages.map(p=>p.id);
  assert.throws(()=>personalizeDocument(source.document,source.personalization,{
    values:{},sections:{order:correct,hidden:["cover"]},
  }));
  assert.throws(()=>personalizeDocument(source.document,source.personalization,{
    values:{},sections:{order:[...correct.slice(1),correct[0]],hidden:[]},
  }));
});

test("v2 template cannot accept section modifications it never permitted",()=>{
  const original=read("v2");
  assert.throws(()=>personalizeDocument(original.document,original.personalization,{
    values:{},sections:{order:original.document.pages.map(p=>p.id),hidden:["letter"]},
  }));
});
