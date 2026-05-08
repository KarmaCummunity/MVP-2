// ─────────────────────────────────────────────
// Image upload pipelines.
//   • Posts: gallery → resize-2048 + JPEG q=0.85 → post-images bucket. FR-POST-005 AC1..AC3.
//   • Avatars: camera|gallery → resize-1024 + JPEG q=0.85 → avatars bucket. FR-AUTH-011 AC1+AC2.
// AC4 EXIF strip is best-effort (re-encode) until the server-side Edge Function lands per TD-23.
// ─────────────────────────────────────────────

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import type { MediaAssetInput } from '@kc/application';
import { MAX_MEDIA_ASSETS } from '@kc/domain';

const POST_RESIZE_MAX_EDGE = 2048;
const AVATAR_RESIZE_MAX_EDGE = 1024;
const COMPRESS = 0.85; // JPEG quality (FR-POST-005 AC3 + FR-AUTH-011 AC2)
const POST_BUCKET = 'post-images';
const AVATAR_BUCKET = 'avatars';

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
 * FR-POST-005 AC2: picks up to (MAX - already) images from the gallery.
 * Returns [] if the user cancels or denies permission.
 */
export async function pickPostImages(alreadyPicked: number): Promise<PickedImage[]> {
  const remaining = Math.max(0, MAX_MEDIA_ASSETS - alreadyPicked);
  if (remaining === 0) return [];

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
 * Resize the image to a max-edge size and re-encode to JPEG (strips most EXIF).
 * Returns a Blob ready for Supabase Storage upload.
 */
async function resizeImage(uri: string, maxEdge: number): Promise<{ blob: Blob; sizeBytes: number }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxEdge } }],
    { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG },
  );
  // Fetch the resized file back as a Blob — Supabase JS upload signature wants
  // an ArrayBuffer / Blob / File, not a file:// URI.
  const response = await fetch(manipulated.uri);
  const blob = await response.blob();
  return { blob, sizeBytes: blob.size };
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
  const { blob, sizeBytes } = await resizeImage(picked.uri, POST_RESIZE_MAX_EDGE);
  const path = buildPostImagePath(userId, batchUuid, ordinal);

  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(POST_BUCKET)
    .upload(path, blob, {
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

// ── Avatars (FR-AUTH-011) ──────────────────────────────────────────────────────

export type AvatarSource = 'camera' | 'gallery';

/** Camera capture is mobile-only; web users are gallery-only. */
export const isCameraAvailable = Platform.OS !== 'web';

/**
 * FR-AUTH-011 AC1: pick a single image from the camera or the gallery.
 * Returns null on cancel / permission denial / camera-on-web.
 */
export async function pickAvatarImage(source: AvatarSource): Promise<PickedImage | null> {
  if (source === 'camera') {
    if (!isCameraAvailable) return null;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      exif: false,
    });
    if (result.canceled) return null;
    const a = result.assets[0];
    return { uri: a.uri, width: a.width, height: a.height, fileSize: a.fileSize ?? null };
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: false,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, width: a.width, height: a.height, fileSize: a.fileSize ?? null };
}

/**
 * FR-AUTH-011 AC2: resize to 1024px max edge + JPEG q=0.85, upload to `avatars` bucket
 * at `<userId>/avatar.jpg` (single file per user; upsert on every change).
 * Returns the full public URL to persist into `users.avatar_url`.
 */
export async function resizeAndUploadAvatar(picked: PickedImage, userId: string): Promise<string> {
  if (!userId) throw new Error('resizeAndUploadAvatar: userId is required');
  const { blob } = await resizeImage(picked.uri, AVATAR_RESIZE_MAX_EDGE);
  const path = `${userId}/avatar.jpg`;

  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  if (error) throw new Error(`avatar_upload: ${error.message}`);

  // Cache-bust so the new image replaces a previously-cached avatar URL on the same path.
  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
