import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedMessage {
  id: string;
  consultationId: string;
  payload: { content?: string; attachmentUrl?: string };
  createdAt: number;
}

const KEY = 'message_outbox';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueueMessage(
  consultationId: string,
  payload: { content?: string; attachmentUrl?: string }
): Promise<string> {
  const id = genId();
  const item: QueuedMessage = { id, consultationId, payload, createdAt: Date.now() };
  const pending = await getPendingMessages();
  pending.push(item);
  await AsyncStorage.setItem(KEY, JSON.stringify(pending));
  return id;
}

export async function getPendingMessages(): Promise<QueuedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedMessage[]) : [];
  } catch {
    return [];
  }
}

export async function removeMessage(id: string): Promise<void> {
  const pending = await getPendingMessages();
  const next = pending.filter((m) => m.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
