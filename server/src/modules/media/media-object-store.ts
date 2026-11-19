import {Injectable, ServiceUnavailableException} from "@nestjs/common";
import {
  S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import type {UploadMime} from "./media-policy.js";

export class MediaObjectNotFound extends Error {
  constructor() {super("OBJECT_NOT_FOUND"); this.name = "MediaObjectNotFound";}
}

/** Owns R2 credentials. No browser ever receives a bucket secret or raw object key. */
@Injectable()
export class MediaObjectStore {
  private client: S3Client | null = null;
  private bucket: string | null = null;

  private connection() {
    if (this.client && this.bucket) return {client: this.client, bucket: this.bucket};
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId) ||
      !bucket || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) ||
      !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException("R2_NOT_CONFIGURED");
    }
    const endpoint = process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`;
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" ||
        url.search || url.hash ||
        !url.hostname.endsWith(".r2.cloudflarestorage.com")) {
      throw new ServiceUnavailableException("R2_ENDPOINT_INVALID");
    }
    this.bucket = bucket;
    this.client = new S3Client({
      endpoint: url.origin, region: "auto", forcePathStyle: true,
      credentials: {accessKeyId, secretAccessKey},
    });
    return {client: this.client, bucket: this.bucket};
  }

  async signUpload(key: string, mimeType: UploadMime) {
    const {client,bucket} = this.connection();
    return getSignedUrl(client,
      new PutObjectCommand({Bucket: bucket, Key: key, ContentType: mimeType}),
      {expiresIn: 180});
  }

  async readStaged(key: string, sizeLimit: number): Promise<{bytes: Buffer; contentType: string | null}> {
    const {client, bucket} = this.connection();
    let size: number;
    try {
      const h = await client.send(new HeadObjectCommand({Bucket: bucket, Key: key}));
      size = h.ContentLength ?? 0;
    } catch (error) {
      if (error && typeof error === "object" && "name" in error &&
        ["NoSuchKey","NotFound","404"].includes(String(error.name))) throw new MediaObjectNotFound();
      throw error;
    }
    if (!Number.isSafeInteger(size) || size <= 0 || size > sizeLimit) {
      throw new RangeError("STAGED_OBJECT_EXCEEDS_LIMIT");
    }
    const response = await client.send(new GetObjectCommand({Bucket: bucket, Key: key}));
    if (!response.Body) throw new MediaObjectNotFound();
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      total += chunk.byteLength;
      if (total > sizeLimit) throw new RangeError("STAGED_OBJECT_EXCEEDS_LIMIT");
      chunks.push(Buffer.from(chunk));
    }
    if (total !== size) throw new RangeError("STAGED_OBJECT_SIZE_CHANGED");
    return {bytes: Buffer.concat(chunks), contentType: response.ContentType ?? null};
  }

  async putVerified(key: string, body: Uint8Array, mimeType: UploadMime) {
    const {client,bucket} = this.connection();
    await client.send(new PutObjectCommand({
      Bucket: bucket, Key: key, Body: body, ContentType: mimeType,
      CacheControl: "private, max-age=0, no-store",
      ContentDisposition: "inline",
    }));
  }

  async signRead(key: string, mimeType: string) {
    const {client,bucket} = this.connection();
    return getSignedUrl(client,
      new GetObjectCommand({
        Bucket: bucket, Key: key,
        ResponseContentType: mimeType,
        ResponseContentDisposition: "inline",
      }), {expiresIn: mimeType === "audio/mpeg" ? 1200 : 60});
  }

  async removeStaged(key: string) {
    const {client,bucket} = this.connection();
    await client.send(new DeleteObjectCommand({Bucket: bucket, Key: key}));
  }
}
