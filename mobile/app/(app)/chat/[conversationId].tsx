import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ChatBubble } from '@/components/ChatBubble';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useMessages } from '@/hooks/useChat';
import { colors } from '@/theme';
import { ApiError, type Message } from '@/types';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { list, send } = useMessages(conversationId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const messages = list.data ?? [];

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [messages.length]);

  const onSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    try {
      await send.mutateAsync(content);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo enviar el mensaje.';
      if ((err as ApiError)?.code === 'RATE_LIMIT') {
        Toast.show({ type: 'error', text1: 'Esperá un momento', text2: msg });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: msg });
      }
      setDraft(content); // Restore draft so the user can retry
    }
  };

  const escalated = messages.some((m: Message) => m.flagged && m.role === 'ASSISTANT');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {escalated && (
        <Card style={{ marginHorizontal: 12, marginTop: 12, backgroundColor: '#fef2f2' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger }}>
            🚨 Esta conversación fue escalada
          </Text>
          <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
            El asistente detectó una posible emergencia. Te recomendamos solicitar una
            videollamada con un veterinario.
          </Text>
          <Button
            size="sm"
            variant="danger"
            style={{ marginTop: 8 }}
            onPress={() => router.push('/(app)/queue')}
          >
            Pedir videollamada ahora
          </Button>
        </Card>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {list.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : messages.length === 0 ? (
          <Card>
            <Text style={{ fontSize: 14, color: colors.ink, marginBottom: 6, fontWeight: '600' }}>
              ¡Hola! Soy el asistente IA de VetConnect 🤖
            </Text>
            <Text style={{ fontSize: 13, color: colors.inkSoft, lineHeight: 18 }}>
              Podés consultarme dudas no urgentes sobre la salud de tu mascota. Si detecto
              una emergencia, te voy a pedir que pidas una videollamada con un veterinario.
            </Text>
          </Card>
        ) : (
          messages.map((m: Message) => <ChatBubble key={m.id} message={m} />)
        )}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          padding: 10,
          gap: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribí tu consulta…"
          placeholderTextColor={colors.inkMuted}
          multiline
          maxLength={4000}
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: colors.background,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            fontSize: 15,
            color: colors.ink,
          }}
        />
        <Pressable
          onPress={onSend}
          disabled={!draft.trim() || send.isPending}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: draft.trim() ? colors.primary : colors.border,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {send.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
