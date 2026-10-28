import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { EditorError, env } from "./http";

const assetName = /^[\da-f-]{36}\.(webp|woff2?|ttf|otf)$/;

function config() {
  const endpoint = env("S3_ENDPOINT");
  const bucket = env("S3_BUCKET");
  const accessKeyId = env("S3_ACCESS_KEY_ID");
  const secretAccessKey = env("S3_SECRET_ACCESS_KEY");
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey)
    throw new EditorError("Media storage isn’t configured yet.", 503);
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new EditorError("Media storage endpoint must use HTTPS.", 503);
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))
    throw new EditorError("Media storage bucket is invalid.", 503);
  return {
    endpoint: url.href,
    bucket,
    region: env("S3_REGION") || "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
  };
}

let client: S3Client | undefined;
function s3() {
  const settings = config();
  client ??= new S3Client({
    endpoint: settings.endpoint,
    region: settings.region,
    credentials: settings.credentials,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { client, bucket: settings.bucket };
}

/** A cheap authenticated check for the bucket used by the collection. */
export async function assertInspoBucketAvailable(): Promise<void> {
  const { client, bucket } = s3();
  await client.send(new HeadBucketCommand({ Bucket: bucket }), {
    abortSignal: AbortSignal.timeout(5_000),
  });
}

export function validAssetName(name: string): boolean {
  return assetName.test(name);
}

function assetUrl(name: string): string {
  const publicBase = env("S3_PUBLIC_BASE_URL");
  if (!publicBase) return `/api/inspo/assets/${name}`;
  const url = new URL(publicBase);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new EditorError("Public media URL must be a plain HTTPS URL.", 503);
  return new URL(`inspo/${name}`, `${url.href.replace(/\/?$/, "/")}`).href;
}

/** The bucket key behind a media URL we serve, or null for anything external. */
export function inspoAssetKey(src: string): string | null {
  let path: string | null = null;
  if (src.startsWith("/api/inspo/assets/"))
    path = `inspo/${src.slice("/api/inspo/assets/".length)}`;
  else {
    const publicBase = env("S3_PUBLIC_BASE_URL");
    if (publicBase && src.startsWith(publicBase.replace(/\/?$/, "/")))
      path = src.slice(publicBase.replace(/\/?$/, "/").length);
  }
  if (!path || !/^inspo\/[\w.-]+(?:\/[\w.-]+)*$/.test(path)) return null;
  return path.split("/").includes("..") ? null : path;
}

export async function deleteInspoAsset(
  key: string,
  target?: { client: S3Client; bucket: string },
): Promise<void> {
  const { client, bucket } = target ?? s3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function uploadInspoAsset(
  bytes: Buffer,
  extension: string,
  contentType: string,
  target?: { client: S3Client; bucket: string },
): Promise<string> {
  // Names are random, never derived from the request or the uploaded file.
  const name = `${randomUUID()}.${extension}`;
  if (!validAssetName(name)) throw new EditorError("Invalid media filename.");
  const { client, bucket } = target ?? s3();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `inspo/${name}`,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return assetUrl(name);
}

export async function readInspoAsset(
  name: string,
  target?: { client: S3Client; bucket: string },
): Promise<Uint8Array | null> {
  if (!validAssetName(name)) return null;
  const { client, bucket } = target ?? s3();
  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: `inspo/${name}` }),
    );
    return result.Body ? await result.Body.transformToByteArray() : null;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error.name === "NoSuchKey" || error.name === "NotFound")
    )
      return null;
    throw error;
  }
}
