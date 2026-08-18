import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import AuthScreen from '@/components/AuthScreen';
import ConsultationsHome from '@/components/ConsultationsHome';

export default function Index() {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0b0f' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;
  return <ConsultationsHome onOpen={(id) => router.push(`/chat/${id}`)} />;
}
