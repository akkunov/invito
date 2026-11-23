import assert from "node:assert/strict";
import {test} from "node:test";
import {templatePackageSchema} from "../src/modules/documents/template-package.js";

const base = {
  format: "eventiq-template",
  version: 1,
  manifest: {
    slug: "editorial-ivory",
    name: "Editorial Ivory",
    description: "Elegant wedding invitation",
    category: "WEDDING",
    tags: ["editorial"],
    coverPageId: "cover",
  },
  document: {placeholder: "Document validated by the canonical Studio v2 service"},
  personalization: {version: 1, locales: ["ru", "ky"], fields: []},
};

test("template package accepts a strictly versioned manifest", () => {
  const result = templatePackageSchema.parse(base);
  assert.equal(result.format, "eventiq-template");
  assert.equal(result.manifest.slug, "editorial-ivory");
  assert.equal(result.manifest.category, "WEDDING");
});

test("template package rejects unknown fields, unsupported versions and slugs", () => {
  assert.equal(templatePackageSchema.safeParse({...base, executableCode: "alert(1)"}).success, false);
  assert.equal(templatePackageSchema.safeParse({...base, version: 2}).success, false);
  assert.equal(templatePackageSchema.safeParse({...base, manifest: {...base.manifest, slug: "../unsafe"}}).success, false);
  assert.equal(templatePackageSchema.safeParse({...base, manifest: {...base.manifest, workspaceId: "forged"}}).success, false);
  assert.equal(templatePackageSchema.safeParse({...base, personalization: undefined}).success, false);
});
