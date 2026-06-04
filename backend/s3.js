import { randomBytes } from "crypto";
import path from "path";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_S3_REGION || "us-east-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

let client;

function getClient() {
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS S3 is not configured. Set AWS_S3_BUCKET, AWS_S3_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY in backend/.env"
    );
  }
  if (!client) {
    client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export function getScreenshotPublicUrl(key) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function screenshotKeyFromUrl(url) {
  if (!url || !bucket) return null;
  const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export async function uploadScreenshot(file, applicationId) {
  const extension = path.extname(file.originalname || "") || ".png";
  const objectKey = `screenshots/${applicationId}/${Date.now()}-${randomBytes(8).toString("hex")}${extension}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    })
  );

  return {
    key: objectKey,
    publicUrl: getScreenshotPublicUrl(objectKey),
  };
}

export async function deleteScreenshotByUrl(url) {
  const key = screenshotKeyFromUrl(url);
  if (!key) return;

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
