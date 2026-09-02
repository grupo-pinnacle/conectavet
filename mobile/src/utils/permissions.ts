import { Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { mediaService } from '@/services';

export async function requestMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const status = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status.status === 'granted';
}

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const status = await ImagePicker.requestCameraPermissionsAsync();
  return status.status === 'granted';
}

export async function pickImage(): Promise<{ uri: string; mimeType?: string } | null> {
  const allowed = await requestMediaLibraryPermission();
  if (!allowed) {
    if (Platform.OS !== 'web') await Linking.openSettings();
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return { uri: result.assets[0].uri, mimeType: result.assets[0].mimeType };
}

export async function takePhoto(): Promise<{ uri: string; mimeType?: string } | null> {
  const allowed = await requestCameraPermission();
  if (!allowed) {
    if (Platform.OS !== 'web') await Linking.openSettings();
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return { uri: result.assets[0].uri, mimeType: result.assets[0].mimeType };
}

export async function uploadPetPhoto(localUri: string): Promise<string> {
  // Siempre subimos la foto al backend (/media), que la guarda en /uploads y
  // devuelve una URL relativa válida en cualquier dispositivo y en web.
  // Antes caía a un file:// local si faltaba Cloudinary, lo que dejaba la
  // photoUrl inválida fuera del dispositivo que la subió.
  const res = await mediaService.upload({
    uri: localUri,
    name: `pet-${Date.now()}.jpg`,
    type: 'image/jpeg',
  });
  return res.url;
}
