import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Reduce una imagen seleccionada a ≤1080px (lado mayor) y la comprime antes de
 * subirla. Evita OOM/crash en dispositivos de gama baja con fotos de 12MP+ (M-03).
 */
export async function resizeImage(
  asset: ImagePicker.ImagePickerAsset,
  maxSize = 1080,
  quality = 0.8
): Promise<{ uri: string; name: string; type: string }> {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const longest = Math.max(width, height);
  const actions =
    longest > maxSize ? [{ resize: { width: Math.round((width / longest) * maxSize), height: Math.round((height / longest) * maxSize) } }] : [];

  const result = await manipulateAsync(asset.uri, actions, {
    compress: quality,
    format: SaveFormat.JPEG,
  });

  const name = (asset.fileName || `image-${Date.now()}.jpg`).replace(/\.[^.]+$/, '.jpg');
  return { uri: result.uri, name, type: 'image/jpeg' };
}

/**
 * Selecciona una imagen de la galería (o cámara) y la devuelve ya redimensionada
 * y lista para subir vía `mediaService.upload`.
 */
export async function pickAndResizeImage(
  options: { fromCamera?: boolean; maxSize?: number; quality?: number } = {}
): Promise<{ uri: string; name: string; type: string } | null> {
  const picker = options.fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const res = await picker({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });
  if (res.canceled || !res.assets?.length) return null;
  return resizeImage(res.assets[0], options.maxSize, options.quality);
}
