import {readFileSync, statSync} from "node:fs";

/** Package metadata records canonical LF SVG bytes. Git on Windows may
 * already have checked out a text asset with CRLF before .gitattributes
 * was introduced. Only tolerate that specific transformation for SVG. */
export function matchesTemplateAssetSize(bytes, asset) {
  if (bytes.length === asset.sizeBytes) return true;
  if (asset.mimeType !== "image/svg+xml" || !asset.storageKey.endsWith(".svg")) return false;
  const text = bytes.toString("utf8");
  const normalized = text.replace(/\r\n/g, "\n");
  return normalized !== text && Buffer.byteLength(text, "utf8") === bytes.length &&
    Buffer.byteLength(normalized, "utf8") === asset.sizeBytes;
}

export function assertTemplateAssetSize(file, asset) {
  const actual = statSync(file).size;
  if (actual === asset.sizeBytes) return;
  if (asset.mimeType === "image/svg+xml" && asset.storageKey.endsWith(".svg") &&
      matchesTemplateAssetSize(readFileSync(file), asset)) return;
  throw new Error("Unexpected image size: " + asset.storageKey +
    " (expected " + asset.sizeBytes + " bytes, got " + actual + ")");
}
