import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatBubble } from '@/components/ChatBubble';
import { Card, Button } from '@/components/ui';
import { useMessages } from '@/hooks/useChat';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { ApiError, type Message } from '@/types';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { colors: c } = useTheme();
  const { list, send } = useMessages(conversationId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const messages = list.data ?? [];

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }, [messages.length]);

  const onSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    try {
      await send.mutateAsync(content);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos enviar el mensaje.';
      if ((err as ApiError)?.code === 'RATE_LIMIT') {
        Toast.show({ type: 'error', text1: 'Esperá un momento', text2: 'Estamos procesando tu consulta anterior. Enviá el mensaje de nuevo en unos segundos.' });
      } else {
        Toast.show({ type: 'error', text1: 'Error al enviar', text2: msg });
      }
      setDraft(content);
    }
  };

  const escalated = messages.some((m: Message) => m.flagged && m.role === 'ASSISTANT');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
      {escalated && (
        <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Card variant="outlined" padding={spacing.lg} style={{ backgroundColor: c.dangerBg, borderColor: c.dangerLight }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <MaterialCommunityIcons name="alert-circle" size={22} color={c.danger} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: c.danger }}>Esta conversación fue escalada</Text>
                <Text style={{ fontSize: fontSizes.label, color: c.dangerDark, marginTop: spacing.xs, lineHeight: 18 }}>
                  El asistente detectó una posible emergencia. Te recomendamos solicitar una videollamada con un veterinario.
                </Text>
                <Button size="sm" variant="danger" style={{ marginTop: spacing.md }} onPress={() => router.push('/(app)/queue')}>
                  Pedir videollamada ahora
                </Button>
              </View>
            </View>
          </Card>
        </View>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {list.isLoading ? (
          <ActivityIndicator color={c.primary} size="small" />
        ) : messages.length === 0 ? (
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="robot" size={22} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSizes.body, color: c.ink, marginBottom: spacing.sm, fontWeight: fontWeights.semibold }}>¡Hola! Soy el asistente IA de VetConnect</Text>
                <Text style={{ fontSize: fontSizes.body, color: c.inkSoft, lineHeight: 20 }}>
                  Consultame dudas no urgentes sobre la salud de tu mascota. Si detecto una emergencia, te voy a pedir que solicites una videollamada con un veterinario.
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          messages.map((m: Message) => <ChatBubble key={m.id} message={m} />)
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, gap: spacing.sm, backgroundColor: c.surface, borderTopColor: c.borderLight, borderTopWidth: 1 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribí tu consulta…"
          placeholderTextColor={c.inkMuted}
          multiline
          maxLength={4000}
          accessibilityLabel="Mensaje"
          style={{
            flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
            backgroundColor: c.background, borderRadius: radius.full, borderWidth: 1, borderColor: c.border,
            fontSize: fontSizes.input, color: c.ink,
          }}
        />
        <Pressable
          onPress={onSend}
          disabled={!draft.trim() || send.isPending}
          style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: draft.trim() ? c.primary : c.border, justifyContent: 'center', alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !draft.trim() || send.isPending }}
        >
          {send.isPending ? (
            <ActivityIndicator color={c.white} size="small" />
          ) : (
            <MaterialCommunityIcons name="send" size={18} color={c.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
