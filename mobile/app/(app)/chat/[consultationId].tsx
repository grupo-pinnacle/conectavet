import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatBubble } from '@/components/ChatBubble';
import { Card } from '@/components/ui';
import { useConsultationMessages, useConsultation } from '@/hooks/useConsultations';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { ApiError } from '@/types';

export default function ConsultationChatScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const { colors: c } = useTheme();
  const { list, send } = useConsultationMessages(consultationId);
  const { data: consultation } = useConsultation(consultationId);
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
      Toast.show({ type: 'error', text1: 'Error al enviar', text2: msg });
      setDraft(content);
    }
  };

  const vetName = consultation?.vetName ?? 'Veterinario';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: c.surface, borderBottomColor: c.borderLight, borderBottomWidth: 1 }}>
        <View style={{ width: 32, height: 32, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="stethoscope" size={16} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink }}>{vetName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.success }} />
            <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>En línea</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {list.isLoading ? (
          <ActivityIndicator color={c.primary} size="small" />
        ) : messages.length === 0 ? (
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="stethoscope" size={22} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSizes.body, color: c.ink, marginBottom: spacing.sm, fontWeight: fontWeights.semibold }}>Consultá con {vetName}</Text>
                <Text style={{ fontSize: fontSizes.body, color: c.inkSoft, lineHeight: 20 }}>
                  Escribí tu consulta. El veterinario te responderá a la brevedad.
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} vetName={vetName} />)
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, gap: spacing.sm, backgroundColor: c.surface, borderTopColor: c.borderLight, borderTopWidth: 1 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribí tu mensaje…"
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
