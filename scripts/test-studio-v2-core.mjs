import assert from "node:assert/strict";
import { createEmptyProjectV2, isProjectV2, parseProjectV2 } from "../src/features/studio-v2/core/document.schema.ts";

const fresh = createEmptyProjectV2("project-1", "ru");
assert.equal(fresh.schemaVersion, 2);
assert.equal(fresh.pages.length, 1);
assert.equal(fresh.nodes["frame-1"].width, 1080);
assert.deepEqual(parseProjectV2(JSON.parse(JSON.stringify(fresh))), fresh);
assert.ok(isProjectV2(fresh));
assert.equal(isProjectV2({ schemaVersion: 1, elements: [] }), false);

function invalid(patch, message) {
  const changed = structuredClone(fresh);
  patch(changed);
  const result = (() => { try { parseProjectV2(changed); return false; } catch { return true; } })();
  assert.equal(result, true, message);
}
invalid(p => { p.pages[0].rootNodeId = "missing"; }, "broken root");
invalid(p => { p.pages.push({ ...p.pages[0] }); }, "duplicate page");
invalid(p => { p.nodes["frame-1"].children.push("unknown"); }, "missing child");
invalid(p => { p.nodes["frame-1"].parentId = "frame-1"; }, "parent cycle");
invalid(p => { p.nodes["frame-1"].width = Infinity; }, "nonfinite dimensions");
invalid(p => { p.nodes["frame-1"].unexpected = "script"; }, "unknown node fields");
invalid(p => { p.assets.foo = { id: "different", mimeType: "image/png", name: "x", sizeBytes: 100, storageKey: "safe/x" }; }, "asset mismatch");

const multi = structuredClone(fresh);
multi.pages.push({ id: "page-2", name: "RSVP", rootNodeId: "frame-2", placement: { x: 1500, y: -350 } });
multi.nodes["frame-2"] = { ...multi.nodes["frame-1"], id: "frame-2", name: "RSVP" };
assert.equal(parseProjectV2(multi).pages.length, 2, "multiple independently placed frames");

const nested = structuredClone(multi);
nested.nodes["frame-1"].children.push("title-1");
nested.nodes["title-1"] = {
  id: "title-1", type: "text", parentId: "frame-1", x: 20, y: 50,
  width: 700, height: 140, rotation: 0, opacity: 1, visible: true, locked: false,
  runs: [{ text: "Привет мир", style: { fontFamily: "serif", fontSize: 62, fontWeight: 700, italic: false, underline: false, strike: false, color: "#20242B" } }],
  textAlign: "center", bindingKey: null
};
assert.ok(isProjectV2(nested), "valid nested text node");
invalid(p => { p.nodes["frame-1"].children.push("frame-1"); }, "root cycle");
console.log("PASS: v2 project schema, roundtrip, multiple frames, text nodes and invalid refs");
