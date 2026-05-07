// ─────────────────────────────────────────────
// Image upload pipeline for posts.
// Pick → resize-to-2048-and-re-encode → upload → return MediaAssetInput[].
// FR-POST-005 AC1..AC3 client-side; AC4 EXIF strip is best-effort
// (re-encode) until the server-side Edge Function lands per TD-23.
// ─────────────────────────────────────────────

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import type { MediaAssetInput } from '@kc/application';
import { MAX_MEDIA_ASSETS } from '@kc/domain';

const RESIZE_MAX_EDGE = 2048;
const COMPRESS = 0.85; // JPEG quality
const BUCKET = 'post-images';

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
 * Resize the image to a max-edge of 2048px and re-encode to JPEG (strips most EXIF).
 * Returns a Blob ready for Supabase Storage upload.
 */
async function resizeImage(uri: string): Promise<{ blob: Blob; sizeBytes: number }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: RESIZE_MAX_EDGE } }],
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
  const { blob, sizeBytes } = await resizeImage(picked.uri);
  const path = buildPostImagePath(userId, batchUuid, ordinal);

  const client = getSupabaseClient();
  const { error } = await client.storage
    .from(BUCKET)
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
