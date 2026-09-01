import { writeFile } from 'fs/promises';
import { join } from 'path';
import { UPLOADS_DIR } from './media.service';

/**
 * Persiste un archivo subido por el usuario y devuelve una URL servible.
 *
 * - `STORAGE_PROVIDER=local` (default): deja el archivo en disco de la
 *   instancia y devuelve `/uploads/<filename>`. Válido solo en dev / una
 *   instancia con volumen persistente. En PaaS efímero se pierde en redeploy.
 * - `STORAGE_PROVIDER=s3`: sube el buffer a S3/compatible y devuelve la URL
 *   del objeto (el disco local se usa solo como paso temporal). Requiere
 *   `@aws-sdk/client-s3` y las vars AWS_*.
 */
export async function persistUpload(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  if (process.env.STORAGE_PROVIDER === 's3') {
    const url = await uploadToS3(buffer, filename, mimeType);
    return url;
  }
  await writeFile(join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

async function uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<string> {
  // Lazy require: el SDK solo se carga si se habilita S3.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
  const bucket = process.env.AWS_S3_BUCKET as string;
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimeType })
  );
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
