import { Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function requestMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const status = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

export async function uploadPetPhoto(localUri: string): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    return localUri;
  }

  const form = new FormData();
  form.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: `pet-${Date.now()}.jpg`,
  } as unknown as Blob);
  form.append('upload_preset', preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  return json.secure_url as string;
}
