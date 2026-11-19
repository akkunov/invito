/**
 * Prepare a separate, immutable server snapshot. Never mutate IndexedDB or
 * the editor's local state just because a remote upload succeeds or fails.
 */
import {parseProjectV2, type ProjectDocumentV2} from "../core/document.schema.ts";

export type VerifiedCloudAsset = {
  id: string; storageKey: string; mimeType: string; sizeBytes: number;
  sha256: string; pixelWidth: number | null; pixelHeight: number | null;
  status: string;
};
export async function prepareCloudSnapshot(
  source: ProjectDocumentV2,
  loadBlob: (storageKey: string) => Promise<Blob | null>,
  uploadBlob: (name: string, blob: Blob) => Promise<VerifiedCloudAsset>,
  cache?: Map<string, VerifiedCloudAsset>,
): Promise<{document: ProjectDocumentV2; uploads: number}> {
  const document = structuredClone(parseProjectV2(source));
  let uploads = 0;
  for (const asset of Object.values(document.assets)) {
    if (!asset.storageKey.startsWith("local:")) continue;
    const blob = await loadBlob(asset.storageKey);
    if (!blob) throw new Error("LOCAL_MEDIA_MISSING:" + asset.storageKey);
    if (blob.size !== asset.sizeBytes || blob.type !== asset.mimeType) {
      throw new Error("LOCAL_MEDIA_CHANGED:" + asset.storageKey);
    }
    const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())))
      .map(b=>b.toString(16).padStart(2,"0")).join("");
    const key = asset.storageKey + ":" + fingerprint;
    let verified = cache?.get(key);
    if (!verified) {
      verified = await uploadBlob(asset.name, blob);
      if (verified.status !== "READY" || verified.sha256 !== fingerprint ||
          verified.mimeType !== asset.mimeType || verified.sizeBytes !== blob.size ||
          !/^asset:[a-f0-9-]{36}$/i.test(verified.storageKey)) {
        throw new Error("INVALID_MEDIA_VERIFICATION");
      }
      cache?.set(key, verified);
      uploads++;
    }
    asset.storageKey = verified.storageKey;
    asset.mimeType = verified.mimeType as typeof asset.mimeType;
    asset.sizeBytes = verified.sizeBytes;
    if (verified.pixelWidth !== null) asset.pixelWidth = verified.pixelWidth;
    if (verified.pixelHeight !== null) asset.pixelHeight = verified.pixelHeight;
  }
  return {document: parseProjectV2(document), uploads};
}
