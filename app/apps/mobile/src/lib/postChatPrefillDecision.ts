/** FR-CHAT-005 AC4 — decide post-entry composer prefill after thread history loads. */

/** expo-router may surface query params as `string | string[]`. */
export function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function resolveDeferredPostPrefill(options: {
  viewerId: string;
  messages: readonly { senderId: string | null; body: string }[];
  postTitle: string;
  buildTemplate: (title: string) => string;
}): string | null {
  const template = options.buildTemplate(options.postTitle);
  const duplicate = options.messages.some(
    (m) => m.senderId === options.viewerId && m.body === template,
  );
  if (duplicate) return null;
  return template;
}
