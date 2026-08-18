import { useLocalSearchParams, useRouter } from 'expo-router';
import ChatScreen from '@/components/ChatScreen';

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  if (!id) {
    router.back();
    return null;
  }
  return (
    <ChatScreen
      consultationId={String(id)}
      onBack={() => router.back()}
      onCall={(cid) => router.push(`/call/${cid}`)}
    />
  );
}
