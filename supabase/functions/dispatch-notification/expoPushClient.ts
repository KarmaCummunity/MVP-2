const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoMessage {
  to: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  channelId?: 'critical' | 'social';
  threadId?: string;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
  badge?: number;
}

export interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Sends a batch of up to 100 Expo messages. Returns the per-message tickets.
 * The caller is responsible for inspecting each ticket and acting on
 * DeviceNotRegistered / MessageRateExceeded.
 */
export async function sendExpoPush(
  messages: ExpoMessage[],
  accessToken: string | undefined,
): Promise<ExpoTicket[]> {
  if (messages.length === 0) return [];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });
  if (!response.ok) {
    throw new Error(`Expo push HTTP ${response.status}: ${await response.text()}`);
  }
  const json = await response.json();
  return (json?.data as ExpoTicket[]) ?? [];
}
