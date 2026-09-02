import { rename, unlink, writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { UPLOADS_DIR } from './media.service.js';

export async function persistUpload(
  source: string | Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const dest = join(UPLOADS_DIR, filename);

  if (process.env.STORAGE_PROVIDER === 's3') {
    const url = await uploadToS3(source, filename, mimeType);
    if (typeof source === 'string') {
      await unlink(source).catch(() => {});
    }
    return url;
  }

  if (typeof source === 'string') {
    await rename(source, dest);
  } else {
    await writeFile(dest, source);
  }
  return `/uploads/${filename}`;
}

async function uploadToS3(
  source: string | Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
  const bucket = process.env.AWS_S3_BUCKET as string;
  const body = typeof source === 'string' ? createReadStream(source) : source;
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: mimeType })
  );
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

