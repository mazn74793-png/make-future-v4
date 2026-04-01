import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

export async function uploadToR2(buffer, fileName, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}

export async function deleteFromR2(fileName) {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
  }));
}

// Presigned URL — الـ browser يرفع مباشرة لـ R2
export async function getPresignedUploadUrl(fileName, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });
  const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
  return url;
}
