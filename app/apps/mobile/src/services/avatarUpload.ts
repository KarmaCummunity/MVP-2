// ─────────────────────────────────────────────
// Avatar pick + upload pipeline (FR-AUTH-011).
// Pick (camera|gallery) → square center-crop → resize to 1024 + JPEG q=0.85
// → upload to `avatars` bucket at <userId>/avatar.jpg → return public URL.
// ─────────────────────────────────────────────

import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import type { PickedImage } from './imageUpload';
import { base64ToUint8Array } from './mediaEncoding';

const AVATAR_RESIZE_EDGE = 512;
const COMPRESS = 0.85;
const AVATAR_BUCKET = 'avatars';

export type AvatarSource = 'camera' | 'gallery';

/** Camera capture is mobile-only; web users are gallery-only. */
export const isCameraAvailable = Platform.OS !== 'web';

/**
 * If the OS-level permission was permanently denied (`canAskAgain === false`),
 * surface an actionable alert that opens iOS / Android Settings. If denied but
 * the system can still prompt next time, return false silently — the next tap
 * triggers the system sheet again.
 *
 * Returns `true` when the caller may proceed (granted or limited).
 */
async function ensureMediaLibraryPermission(): Promise<boolean> {
  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (result.granted) return true;
  if (result.canAskAgain) return false;
  Alert.alert(
    'גישה לגלריה נדחתה',
    'כדי לבחור תמונה מהגלריה יש לאפשר גישה בהגדרות → קארמה קהילה → תמונות.',
    [
      { text: 'ביטול', style: 'cancel' },
      { text: 'פתח הגדרות', onPress: () => { void Linking.openSettings(); } },
    ],
  );
  return false;
}

async function ensureCameraPermission(): Promise<boolean> {
  const result = await ImagePicker.requestCameraPermissionsAsync();
  if (result.granted) return true;
  if (result.canAskAgain) return false;
  Alert.alert(
    'גישה למצלמה נדחתה',
    'כדי לצלם תמונה יש לאפשר גישה בהגדרות → קארמה קהילה → מצלמה.',
    [
      { text: 'ביטול', style: 'cancel' },
      { text: 'פתח הגדרות', onPress: () => { void Linking.openSettings(); } },
    ],
  );
  return false;
}

/**
 * FR-AUTH-011 AC1: pick a single image from the camera or the gallery.
 * Returns null on cancel / permission denial / camera-on-web.
 *
 * Note: we deliberately do NOT pass `allowsEditing` / `aspect` — on iOS 14+
 * the new PHPickerViewController doesn't support them, and combining them
 * with `aspect: [1,1]` crashes the app on the simulator (iOS 26). We do the
 * square center-crop ourselves in `resizeAndUploadAvatar` via ImageManipulator.
 */
export async function pickAvatarImage(source: AvatarSource): Promise<PickedImage | null> {
  const mediaTypes = ['images'] as ImagePicker.MediaType[]; // SDK 54 array form
  if (source === 'camera') {
    if (!isCameraAvailable) return null;
    if (!(await ensureCameraPermission())) return null;
    const r = await ImagePicker.launchCameraAsync({ mediaTypes, quality: 1, exif: false });
    if (r.canceled) return null;
    const a = r.assets[0]!;
    return { uri: a.uri, width: a.width, height: a.height, fileSize: a.fileSize ?? null };
  }

  if (!(await ensureMediaLibraryPermission())) return null;
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes, allowsMultipleSelection: false, quality: 1, exif: false,
  });
  if (r.canceled) return null;
  const a = r.assets[0]!;
  return { uri: a.uri, width: a.width, height: a.height, fileSize: a.fileSize ?? null };
}

/**
 * Square center-crop the picked image, resize to size×size, JPEG-encode, and
 * return raw bytes (avoids the unreliable `fetch(file://).blob()` path — see
 * `mediaEncoding.ts` for context).
 */
async function squareCropAndResize(picked: PickedImage, size: number): Promise<Uint8Array> {
  const side = Math.min(picked.width, picked.height);
  const originX = Math.max(0, Math.round((picked.width - side) / 2));
  const originY = Math.max(0, Math.round((picked.height - side) / 2));
  const m = await ImageManipulator.manipulateAsync(
    picked.uri,
    [
      { crop: { originX, originY, width: side, height: side } },
      { resize: { width: size, height: size } },
    ],
    { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!m.base64) throw new Error('avatar_resize: manipulator returned no base64 payload');
  return base64ToUint8Array(m.base64);
}

/**
 * FR-AUTH-011 AC2: square center-crop → 1024×1024 JPEG → upload to
 * `avatars/<userId>/avatar.jpg` (upsert). Returns the full public URL with
 * a cache-busting `?v=` param so a replacement avatar isn't served from CDN
 * cache for the same path.
 */
export async function resizeAndUploadAvatar(picked: PickedImage, userId: string): Promise<string> {
  if (!userId) throw new Error('resizeAndUploadAvatar: userId is required');
  const bytes = await squareCropAndResize(picked, AVATAR_RESIZE_EDGE);
  const path = `${userId}/avatar.jpg`;
  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`avatar_upload: ${error.message}`);
  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
