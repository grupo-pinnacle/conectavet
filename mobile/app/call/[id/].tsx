import { useLocalSearchParams, useRouter } from 'expo-router';
import CallScreen from '@/components/CallScreen';

export default function CallRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  if (!id) {
    router.back();
    return null;
  }
  return <CallScreen consultationId={String(id)} onClose={() => router.back()} />;
}
