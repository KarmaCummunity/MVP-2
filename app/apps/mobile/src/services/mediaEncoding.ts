// RN-friendly conversion of an ImageManipulator base64 JPEG to a typed-array
// Supabase Storage can upload as raw bytes.
//
// Why not `fetch(file://uri).blob()`? On iOS (RN 0.81 / SDK 54) the resulting
// Blob is intermittently empty — the upload completes against Storage but the
// stored file is 0 bytes, so the Image tag renders nothing. Going through
// `manipulateAsync({ base64: true })` + manual decode is the documented
// workaround in the Supabase RN guide.

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
