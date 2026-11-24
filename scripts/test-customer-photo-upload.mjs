import assert from "node:assert/strict";
import {test} from "node:test";
import {photoDimensions,galleryAfterUpload} from "../src/features/invitations/photo-geometry.ts";

const bounds={minWidth:300,minHeight:150};
test("portrait and landscape photos are downscaled without changing proportions",()=>{
 for(const [w,h] of [[6000,4000],[4000,6000],[12000,9000]]){
  const next=photoDimensions(w,h,bounds);
  assert.equal(Math.max(next.width,next.height),2400);
  assert.ok(Math.abs(next.width/next.height-w/h)<.002);
  assert.equal(next.sourceWidth,w);assert.equal(next.sourceHeight,h);
 }
});
test("small images are resized to the template minimum",()=>{
 const result=photoDimensions(120,80,bounds);
 assert.equal(result.width,300);assert.equal(result.height,200);
});
test("extreme panorama is cropped centrally to a valid size",()=>{
 const result=photoDimensions(10000,100,bounds);
 assert.equal(result.width,2400);assert.equal(result.height,150);
 assert.equal(result.sourceWidth,1600);assert.equal(result.sourceX,4200);
});
test("invalid geometry is rejected",()=>{
 assert.throws(()=>photoDimensions(0,100,bounds));
 assert.throws(()=>photoDimensions(100,100,{minWidth:5000,minHeight:1}));
});
test("full demo gallery can be replaced with four customer photos",()=>{
 assert.deepEqual(galleryAfterUpload(["a","b","c","d"],["p","q","r","s"],4,"replace"),["p","q","r","s"]);
});
test("partial failed replacements retain prior slots; append keeps existing order",()=>{
 assert.deepEqual(galleryAfterUpload(["a","b","c","d"],["p",null,"r",null],4,"replace"),["p","b","r","d"]);
 assert.deepEqual(galleryAfterUpload(["a"],["p",null,"r"],4,"append"),["a","p","r"]);
 assert.deepEqual(galleryAfterUpload(["a","b"],["p"],4,"replace"),["p"]);
});
