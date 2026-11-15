import fs from "node:fs";import assert from "node:assert/strict";
const data=JSON.parse(fs.readFileSync("docs/national-designs.json","utf8"));
assert.equal(data.length,30);assert.equal(new Set(data.map(x=>x.slug)).size,30);
const counts={};for(const x of data){counts[x.category]=(counts[x.category]??0)+1;assert.ok(x.name.ru&&x.name.ky);assert.ok(fs.readFileSync("public"+x.image,"utf8").includes("<svg"));}
assert.deepEqual(counts,{"wedding":8,"kyz-uzatuu":7,"nike":4,"beshik-toi":4,"tushoo":3,"anniversary":4});
for(const [file,token] of [["src/features/invitations/seed-templates.ts","nationalTemplates"],["src/features/invitations/collection-templates.ts","nationalDesigns.find"],["src/features/invitations/heritage-covers.ts","nationalCoverOptions"]]) assert.ok(fs.readFileSync(file,"utf8").includes(token));
console.log("PASS 30 national templates, 6 categories, assets and registry");
