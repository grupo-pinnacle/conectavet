import { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useConsultationMessages } from '@/hooks/useConsultations';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import type { ChatMessage } from '@/types';

export default function ChatScreen({
  consultationId,
  onBack,
  onCall,
}: {
  consultationId: string;
  onBack: () => void;
  onCall: (id: string) => void;
}) {
  const { colors: c } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const { list, send } = useConsultationMessages(consultationId, userId);
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList<ChatMessage>>(null);
  const messages = list.data ?? [];

  useEffect(() => {
    if (messages.length) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    send.mutate({ content });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderColor: c.border, gap: spacing.sm }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: c.primary, fontSize: fontSizes.body }}>← Volver</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontWeight: fontWeights.semibold, color: c.ink }}>Consulta</Text>
        <Button size="sm" variant="outline" onPress={() => onCall(consultationId)}>Videollamada</Button>
      </View>

      {!list.isLoading && messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ color: c.textMuted }}>Escribile a tu veterinario.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          renderItem={({ item }) => {
            const mine = item.senderId === userId;
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                <View
                  style={{
                    maxWidth: '80%',
                    padding: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: mine ? c.primary : c.card,
                  }}
                >
                  <Text style={{ color: mine ? c.white : c.ink }}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderColor: c.border }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribí un mensaje…"
          placeholderTextColor={c.textMuted}
          style={{
            flex: 1,
            backgroundColor: c.card,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            color: c.ink,
            borderWidth: 1,
            borderColor: c.border,
          }}
          onSubmitEditing={submit}
        />
        <Button onPress={submit} loading={send.isPending}>Enviar</Button>
      </View>
    </KeyboardAvoidingView>
  );
}
