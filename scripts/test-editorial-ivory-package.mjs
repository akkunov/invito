import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {test} from "node:test";
import {validatedTemplateVersion,assertReadyAssets} from "../server/domain/persistence-contract.ts";
import {finalizePersonalization,personalizationIssues} from "../src/features/studio-v2/core/personalization.ts";
import {bindDocument} from "../src/features/studio-v2/core/invitation-behavior.ts";

const path=fileURLToPath(new URL("../templates/packages/editorial-ivory.v1.json",import.meta.url));
const packageData=JSON.parse(readFileSync(path,"utf8"));
const trustedAssets=new Set([
  "/images/riviera/couple.webp",
  "/images/riviera/fabric-left.webp",
  "/images/riviera/fabric-right.webp",
  "/images/riviera/flowers.webp",
  "/images/riviera/villa.webp",
]);

test("Editorial Ivory — versioned import envelope and 6 editorial sections",()=>{
  assert.equal(packageData.format,"eventiq-template");
  assert.equal(packageData.version,1);
  assert.equal(packageData.manifest.slug,"editorial-ivory");
  assert.equal(packageData.manifest.coverPageId,"cover");
  assert.equal(packageData.document.pages.length,6);
  assert.equal(packageData.personalization.version,1);
  assert.deepEqual(packageData.personalization.locales,["ru","ky"]);
});

test("Editorial Ivory — canonical Studio v2 snapshot, allowed fields and trusted media",()=>{
  const {snapshot,contract}=validatedTemplateVersion(packageData.document,packageData.personalization);
  assert.ok(contract);
  assert.ok(contract.fields.length>=10);
  assert.deepEqual(personalizationIssues(snapshot,contract),[]);
  assertReadyAssets(snapshot,"00000000-0000-4000-8000-000000000001",[],trustedAssets);
  assert.ok(Object.values(snapshot.nodes).every(node=>node.type!=="text"||node.runs.every(run=>run.style.italic===false)));
  assert.ok(Object.values(snapshot.nodes).some(node=>node.type==="widget"&&node.block.kind==="rsvp"));
  assert.ok(Object.values(snapshot.nodes).some(node=>node.type==="widget"&&node.block.kind==="schedule"));
  assert.ok(Object.values(snapshot.nodes).some(node=>node.type==="widget"&&node.block.kind==="countdown"));
  assert.ok(Object.values(snapshot.nodes).some(node=>node.type==="widget"&&node.block.kind==="location"));
});

test("Editorial Ivory — publishing validates initial personalization and RU/KY variants",()=>{
  const {snapshot,contract}=validatedTemplateVersion(packageData.document,packageData.personalization);
  assert.ok(contract);
  assert.equal(finalizePersonalization(snapshot,contract,{values:{}}).locale,"ru");
  const kyrgyz=finalizePersonalization(snapshot,contract,{locale:"ky",values:{}});
  const bound=bindDocument(kyrgyz);
  assert.equal(bound.nodes.letterHeading.runs[0].text,"Урматтуу достор");
  assert.equal(bound.nodes.rsvpHeading.runs[0].text,"Биз менен болосузбу?");
});

test("Editorial Ivory — only approved guest fields can change",()=>{
  const {snapshot,contract}=validatedTemplateVersion(packageData.document,packageData.personalization);
  assert.ok(contract);
  assert.throws(()=>finalizePersonalization(snapshot,contract,{
    values:{unapprovedGeometry:{kind:"binding",value:{type:"number",value:5}}},
  }));
});
