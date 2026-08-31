import { z } from "zod";
import { cloudinary } from "./cloudinary";

// Tipos de recursos permitidos (imagen, video, pdf/documento)
export const MediaTypeSchema = z.enum(["image", "video", "raw"]); // raw = pdf/docs
export type MediaType = z.infer<typeof MediaTypeSchema>;

// Carpeta base por tipo (organización en Cloudinary)
export function getUploadFolder(type: MediaType, context?: string): string {
  const base = `conectavet/${type}s`;
  return context ? `${base}/${context}` : base;
}

// Genera signed upload URL (para subir directo del cliente a Cloudinary)
// https://cloudinary.com/documentation/upload_images#signed_upload_urls
export function generateSignedUploadParams({
  type,
  context,
  maxSizeBytes = 50 * 1024 * 1024, // 50MB default
  allowedFormats,
}: {
  type: MediaType;
  context?: string;
  maxSizeBytes?: number;
  allowedFormats?: string[];
}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getUploadFolder(type, context);

  const params: Record<string, unknown> = {
    timestamp,
    folder,
    // Validación server-side tras upload (además del cliente)
    ...(allowedFormats?.length && { allowed_formats: allowedFormats.join(",") }),
    // Límite de tamaño
    ...(maxSizeBytes && { max_file_size: maxSizeBytes }),
    // Overwrite si mismo public_id (no esperado aquí)
    overwrite: false,
    unique_filename: true,
    use_filename: false,
  };

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${type}/upload`,
    params: {
      ...params,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY!,
    },
  };
}

// Genera signed upload para múltiples (usa unsigned upload preset si preferís, pero signed es más seguro)
// Para simplicidad, devolvemos params por archivo; el cliente hace N requests.
export function generateSignedUploadParamsBatch(
  files: Array<{ type: MediaType; context?: string; maxSizeBytes?: number; allowedFormats?: string[] }>
) {
  return files.map((f) => generateSignedUploadParams(f));
}

// Verifica resultado de upload (webhook o callback del cliente)
export async function verifyUploadResult(publicId: string, expectedType: MediaType) {
  try {
    const result = await cloudinary.api.resource(publicId, { resource_type: expectedType });
    return { success: true, resource: result };
  } catch {
    return { success: false };
  }
}

// Elimina recurso (cleanup si consulta se cancela, etc.)
export async function deleteResource(publicId: string, type: MediaType) {
  return cloudinary.uploader.destroy(publicId, { resource_type: type });
}

// URL de entrega optimizada (f_auto, q_auto)
export function getDeliveryUrl(publicId: string, type: MediaType, transformations?: Record<string, unknown>) {
  return cloudinary.url(publicId, {
    resource_type: type,
    secure: true,
    ...transformations,
  });
}

// Thumbnail para imágenes (primer frame para video)
export function getThumbnailUrl(publicId: string, type: MediaType, width = 300, height = 300) {
  if (type === "image") {
    return getDeliveryUrl(publicId, "image", { width, height, crop: "fill", gravity: "auto", quality: "auto", format: "auto" });
  }
  if (type === "video") {
    return getDeliveryUrl(publicId, "video", { width, height, crop: "fill", gravity: "auto", quality: "auto", format: "jpg" });
  }
  return null; // raw (pdf) no tiene thumbnail automático simple
}