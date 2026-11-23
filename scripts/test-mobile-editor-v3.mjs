import assert from "node:assert/strict";
import {test} from "node:test";
import {editableFieldForNode} from "../src/features/invitations/mobile-editor-selection.ts";

const nodes={
  name:{id:"name",type:"text",bindingKey:"names",locked:true},
  caption:{id:"caption",type:"text",bindingKey:null,locked:true},
  photo:{id:"photo",type:"image",assetId:"photoAsset",locked:true},
  decor:{id:"decor",type:"shape",locked:true},
  gallery:{id:"gallery",type:"widget",block:{kind:"gallery"},locked:true},
  date:{id:"date",type:"widget",block:{kind:"countdown",targetKey:"ceremonyDate"},locked:true},
  venue:{id:"venue",type:"widget",block:{kind:"location",addressKey:"venueAddress"},locked:true},
  music:{id:"music",type:"widget",block:{kind:"music"},locked:true},
};
const fields=[
  {id:"namesField",kind:"text",key:"names"},
  {id:"photoField",kind:"image",nodeId:"photo"},
  {id:"galleryField",kind:"gallery",nodeId:"gallery"},
  {id:"ceremonyField",kind:"date",key:"ceremonyDate"},
  {id:"locationField",kind:"text",key:"venueAddress"},
];
const doc={nodes};

test("touching locked text can select only its approved personalized binding",()=>{
  assert.equal(editableFieldForNode(doc,fields,"name")?.id,"namesField");
  assert.equal(editableFieldForNode(doc,fields,"caption"),undefined);
});
test("images and gallery require direct node permissions",()=>{
  assert.equal(editableFieldForNode(doc,fields,"photo")?.id,"photoField");
  assert.equal(editableFieldForNode(doc,fields,"gallery")?.id,"galleryField");
  assert.equal(editableFieldForNode(doc,fields,"music"),undefined);
});
test("countdown and location resolve their approved variable targets",()=>{
  assert.equal(editableFieldForNode(doc,fields,"date")?.id,"ceremonyField");
  assert.equal(editableFieldForNode(doc,fields,"venue")?.id,"locationField");
});
test("decorative and unknown nodes cannot be edited",()=>{
  assert.equal(editableFieldForNode(doc,fields,"decor"),undefined);
  assert.equal(editableFieldForNode(doc,fields,"missing"),undefined);
});
