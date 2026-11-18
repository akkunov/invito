import {createHash} from "node:crypto";
import sharp from "sharp";
import {parseBuffer} from "music-metadata";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 4096;
export const MAX_DECODE_PIXELS = 32_000_000;
export const MAX_WORKSPACE_BYTES = 500n * 1024n * 1024n;
export const MAX_PENDING_UPLOADS = 20;
export const UPLOAD_TTL_MS = 15 * 60 * 1000;
export type UploadMime = "image/jpeg" | "image/png" | "image/webp" | "audio/mpeg";
export const UPLOAD_MIMES = ["image/jpeg", "image/png", "image/webp", "audio/mpeg"] as const;
const formatOf: Record<string, UploadMime> = {jpeg: "image/jpeg", png: "image/png", webp: "image/webp"};

export function maxBytesFor(mime: UploadMime): number {
  return mime === "audio/mpeg" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
}
export function objectExtension(mime: UploadMime): string {
  return ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","audio/mpeg":"mp3"} as const)[mime];
}
export function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
export class MediaContentError extends Error {
  constructor(message: string) {super(message); this.name="MediaContentError";}
}
export async function inspectMedia(bytes: Uint8Array, mime: UploadMime) {
  if (bytes.byteLength === 0 || bytes.byteLength > maxBytesFor(mime)) {
    throw new MediaContentError("INVALID_FILE_SIZE");
  }
  if (mime === "audio/mpeg") {
    // ID3 metadata and MPEG audio frame headers; reject non-audio polyglots early.
    const startsWithId3 = bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const startsWithFrame = bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    if (!startsWithId3 && !startsWithFrame) throw new MediaContentError("INVALID_MP3_SIGNATURE");
    try {
      const metadata = await parseBuffer(bytes, {mimeType: "audio/mpeg", size: bytes.byteLength},
        {duration: true, skipCovers: true});
      const format = metadata.format;
      if (format.container !== "MPEG" || !Number.isFinite(format.duration) ||
          !format.duration || format.duration <= 0 || format.duration > 900 ||
          !format.sampleRate || format.sampleRate < 8000 || format.sampleRate > 96000 ||
          !format.numberOfChannels || format.numberOfChannels > 2) {
        throw new MediaContentError("INVALID_MP3_METADATA");
      }
      return {mimeType: mime, width: null, height: null};
    } catch {
      throw new MediaContentError("INVALID_MP3_DATA");
    }
  }

  // Sharp is allowed to decode only bounded raster input. SVG, GIF and animation are excluded.
  try {
    const image = sharp(bytes, {limitInputPixels: MAX_DECODE_PIXELS, failOn: "error"});
    const m = await image.metadata();
    if (formatOf[m.format] !== mime || !m.width || !m.height || m.width > MAX_IMAGE_SIDE ||
      m.height > MAX_IMAGE_SIDE || m.width * m.height > MAX_DECODE_PIXELS ||
      (m.pages ?? 1) !== 1) throw new MediaContentError("INVALID_IMAGE_FORMAT_OR_DIMENSIONS");
    // Decode a small output to ensure the file is actually decodable, not just a plausible header.
    await sharp(bytes, {limitInputPixels: MAX_DECODE_PIXELS, failOn: "error"})
      .resize(1, 1).toBuffer();
    return {mimeType: mime, width: m.width, height: m.height};
  } catch {
    throw new MediaContentError("INVALID_RASTER_DATA");
  }
}
