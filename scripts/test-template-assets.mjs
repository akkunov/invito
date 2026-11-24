import assert from "node:assert/strict";
import {readFileSync, readdirSync, realpathSync} from "node:fs";
import {extname, resolve, sep} from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import sharp from "sharp";
import {validatedTemplateVersion} from "../server/domain/persistence-contract.ts";
import {assertTemplateAssetSize} from "./template-asset-size.mjs";

const packages = new URL("../templates/packages/", import.meta.url);
const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const imageRoot = realpathSync(resolve(publicRoot, "images"));
const imageTypes = {
  "image/jpeg": {format: "jpeg", extensions: [".jpg", ".jpeg"]},
  "image/png": {format: "png", extensions: [".png"]},
  "image/webp": {format: "webp", extensions: [".webp"]},
  "image/svg+xml": {format: "svg", extensions: [".svg"]},
};

async function checkAsset(asset) {
  const {storageKey, mimeType, pixelWidth, pixelHeight} = asset;
  assert.match(storageKey, /^\/images\/(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+$/,
    "Checked-in packages must ship their assets under /images/");
  const file = realpathSync(resolve(publicRoot, "." + storageKey));
  assert.ok(file.startsWith(imageRoot + sep), "Asset resolves outside public/images");
  const type = imageTypes[mimeType];
  assert.ok(type.extensions.includes(extname(storageKey).toLowerCase()), "File extension does not match MIME type");
  assertTemplateAssetSize(file, asset);

  const image = sharp(file, {failOn: "warning"});
  const {format, width, height} = await image.metadata();
  assert.equal(format, type.format, "Decoded format does not match MIME type");
  if (pixelWidth !== undefined) assert.equal(width, pixelWidth, "Incorrect pixelWidth");
  if (pixelHeight !== undefined) assert.equal(height, pixelHeight, "Incorrect pixelHeight");
  await image.stats();
}

const files = readdirSync(packages).filter(name => name.endsWith(".json")).sort();
assert.ok(files.length, "No checked-in template packages found");

for (const name of files) {
  test(name, async () => {
    const pack = JSON.parse(readFileSync(new URL(name, packages), "utf8"));
    assert.equal(pack.format, "eventiq-template");
    assert.equal(pack.version, 1);
    assert.match(name, /\.v[1-9]\d*\.json$/);
    assert.equal(pack.manifest.slug, name.replace(/\.v[1-9]\d*\.json$/, ""));
    const {snapshot, contract} = validatedTemplateVersion(pack.document, pack.personalization);
    assert.ok(contract, "Missing personalization contract");
    assert.ok(snapshot.pages.some(({id}) => id === pack.manifest.coverPageId), "Missing cover page");

    const issues = [];
    for (const asset of Object.values(snapshot.assets)) {
      try {
        await checkAsset(asset);
      } catch (error) {
        issues.push(asset.storageKey + " — " + error.message);
      }
    }
    assert.deepEqual(issues, [], issues.join("\n"));
  });
}
