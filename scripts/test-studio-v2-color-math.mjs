import assert from "node:assert/strict";
import {normalizeHex,hexToHsv,hsvToHex} from "../src/features/studio-v2/core/color-math.ts";
assert.equal(normalizeHex("abc"),"#AABBCC");
assert.equal(normalizeHex("#123456"),"#123456");
for(const bad of ["#12","#12345678","bad hex","transparent",""])assert.equal(normalizeHex(bad),null);
for(const c of ["#000000","#FFFFFF","#FF0000","#00FF00","#0000FF","#263329","#FAF7EF","#789ABC","#AABBCC"]){const {h,s,v}=hexToHsv(c);assert.equal(hsvToHex(h,s,v),c);}
assert.equal(hsvToHex(360,1,1),"#FF0000");
assert.equal(hsvToHex(-120,1,1),"#0000FF");
assert.equal(hsvToHex(0,0,.5),"#808080");
console.log("PASS: HEX validation, RGB-HSV round-trip and hue wrap");
