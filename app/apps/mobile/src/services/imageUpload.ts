// ─────────────────────────────────────────────
// Post-image pick + upload pipeline (FR-POST-005).
// Gallery → resize-2048 + JPEG q=0.85 → post-images bucket.
// AC4 EXIF strip is best-effort (re-encode) until the server-side Edge
// Function lands per TD-23.
// Avatar pipeline lives in ./avatarUpload.ts.
// ─────────────────────────────────────────────

import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import type { MediaAssetInput } from '@kc/application';
import { MAX_MEDIA_ASSETS } from '@kc/domain';
import { base64ToUint8Array } from './mediaEncoding';

const POST_RESIZE_MAX_EDGE = 2048;
const COMPRESS = 0.85; // JPEG quality (FR-POST-005 AC3)
const POST_BUCKET = 'post-images';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  fileSize: number | null; // ImagePicker reports null on web
}

export interface UploadedAsset extends MediaAssetInput {
  /** Local URI returned by the picker — use to render a preview before publish. */
  previewUri: string;
}

/**
 * If permission is permanently denied (`canAskAgain === false`), surface an
 * actionable alert that opens iOS / Android Settings. Returns true when the
 * caller may proceed.
 */
async function ensureMediaLibraryPermission(): Promise<boolean> {
  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (result.granted) return true;
  if (result.canAskAgain) return false;
  Alert.alert(
    'גישה לגלריה נדחתה',
    'כדי לבחור תמונות יש לאפשר גישה בהגדרות → קהילת קארמה → תמונות.',
    [
      { text: 'ביטול', style: 'cancel' },
      { text: 'פתח הגדרות', onPress: () => { void Linking.openSettings(); } },
    ],
  );
  return false;
}

/**
 * FR-POST-005 AC2: picks up to (MAX - already) images from the gallery.
 * Returns [] if the user cancels or denies permission.
 */
export async function pickPostImages(alreadyPicked: number): Promise<PickedImage[]> {
  const remaining = Math.max(0, MAX_MEDIA_ASSETS - alreadyPicked);
  if (remaining === 0) return [];

  if (!(await ensureMediaLibraryPermission())) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'] as ImagePicker.MediaType[], // SDK 54 array form
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 1,
    exif: false, // ask the picker not to include EXIF; not all platforms honor it
  });
  if (result.canceled) return [];

  return result.assets.map((a) => ({
    uri: a.uri,
    width: a.width,
    height: a.height,
    fileSize: a.fileSize ?? null,
  }));
}

/**
 * Build the storage path for an upload.
 * Format: <userId>/<batchUuid>/<ordinal>.jpg
 * The RLS Storage policy `post_images_insert_own` requires the first folder
 * segment to equal auth.uid() (see 0002_init_posts.sql:294-298).
 */
export function buildPostImagePath(userId: string, batchUuid: string, ordinal: number): string {
  if (!userId) throw new Error('buildPostImagePath: userId is required');
  if (!batchUuid) throw new Error('buildPostImagePath: batchUuid is required');
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal > 4)
    throw new Error('buildPostImagePath: ordinal must be 0..4');
  return `${userId}/${batchUuid}/${ordinal}.jpg`;
}

/**
 * Resize the image to a max-edge size, JPEG-encode, and return raw bytes.
 * fetch(file://).blob() is unreliable on iOS — see `mediaEncoding.ts` for context.
 */
async function resizeImage(uri: string, maxEdge: number): Promise<{ bytes: Uint8Array; sizeBytes: number }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxEdge } }],
    { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!manipulated.base64) throw new Error('image_resize: manipulator returned no base64 payload');
  const bytes = base64ToUint8Array(manipulated.base64);
  return { bytes, sizeBytes: bytes.byteLength };
}

/**
 * Resize, upload, and return the MediaAssetInput shape expected by CreatePostInput.
 * Throws if upload fails so the caller can show "Failed: retry" UI.
 */
export async function resizeAndUploadImage(
  picked: PickedImage,
  userId: string,
  batchUuid: string,
  ordinal: number,
): Promise<UploadedAsset> {
  const { bytes, sizeBytes } = await resizeImage(picked.uri, POST_RESIZE_MAX_EDGE);
  const path = buildPostImagePath(userId, batchUuid, ordinal);

  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(POST_BUCKET)
    .upload(path, bytes, {
      contentType: 'image/jpeg',
      upsert: true, // tolerate retries for the same ordinal
    });
  if (error) throw new Error(`upload[${ordinal}]: ${error.message}`);

  return {
    path,
    mimeType: 'image/jpeg',
    sizeBytes,
    previewUri: picked.uri,
  };
}

/** Generate a per-create-action UUID for the storage folder. */
export function newUploadBatchId(): string {
  return Crypto.randomUUID();
}
