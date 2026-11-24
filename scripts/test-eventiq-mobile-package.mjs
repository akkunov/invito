import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";
import {test} from "node:test";
import {assertReadyAssets, validatedTemplateVersion} from "../server/domain/persistence-contract.ts";
import {bindDocument, countdownTarget} from "../src/features/studio-v2/core/invitation-behavior.ts";
import {finalizePersonalization, personalizationIssues} from "../src/features/studio-v2/core/personalization.ts";
import {presentationSize, responsiveDocument} from "../src/features/studio-v2/core/responsive-engine.ts";

const pack = JSON.parse(readFileSync(new URL("../templates/packages/eventiq-mobile.v1.json", import.meta.url), "utf8"));
const {snapshot, contract} = validatedTemplateVersion(pack.document, pack.personalization);

test("Eventiq Mobile imports as a new six-section package with trusted, replaceable media", () => {
  assert.equal(pack.manifest.slug, "eventiq-mobile");
  assert.equal(snapshot.presentation, "editorial");
  assert.deepEqual(snapshot.pages.map(page => page.id), ["cover", "countdown", "program", "gallery", "venue", "rsvpPage"]);
  assert.deepEqual(personalizationIssues(snapshot, contract), []);
  const trusted = new Set(["cover", "landscape", "bouquet", "rings", "shadows", "venue"]
    .map(name => "/images/eventiq-mobile/" + name + ".webp"));
  assertReadyAssets(snapshot, "00000000-0000-4000-8000-000000000001", [], trusted);
  for (const asset of Object.values(snapshot.assets)) {
    assert.equal(statSync(new URL("../public" + asset.storageKey, import.meta.url)).size, asset.sizeBytes);
  }
  const mobile = responsiveDocument(snapshot, "mobile");
  for (const page of mobile.pages) {
    const root = mobile.nodes[page.rootNodeId];
    assert.equal(presentationSize(snapshot, mobile, page, "mobile").width, 390);
    for (const id of root.children) {
      const {x, y, width, height} = mobile.nodes[id];
      assert.ok(x >= 0 && y >= 0 && x + width <= root.width && y + height <= root.height, id);
    }
  }
});

test("Publication keeps localized text, date binding, photo replacements and studio widgets", () => {
  for (const [locale, names, date] of [
    ["ru", "НУРБЕК\nИ АЛИНА", "24 МАЯ 2026"],
    ["ky", "НУРБЕК\nЖАНА АЛИНА", "24-МАЙ 2026"],
  ]) {
    const publication = finalizePersonalization(snapshot, contract, {
      locale,
      values: {
        names: {kind:"binding",value:{type:"text",value:{ru:"НУРБЕК\nИ АЛИНА",ky:"НУРБЕК\nЖАНА АЛИНА"}}},
        coverPhoto: {kind:"image",assetId:"landscape"},
        galleryPhotos: {kind:"gallery",assetIds:["venue","cover"]},
      },
    });
    const bound = bindDocument(publication);
    assert.equal(bound.presentation, "editorial");
    assert.equal(bound.nodes.coverNames.runs[0].text, names);
    assert.equal(bound.nodes.coverDate.runs[0].text, date);
    assert.equal(bound.nodes.coverImage.assetId, "landscape");
    assert.deepEqual(bound.nodes.galleryWidget.block.assetIds, ["venue","cover"]);
    assert.equal(countdownTarget(bound, bound.nodes.countdownWidget.block), "2026-05-24T17:00:00+06:00");
    assert.equal(bound.nodes.rsvpWidget.block.kind, "rsvp");
    assert.equal(bound.nodes.musicPlayer.block.kind, "music");
  }
});
