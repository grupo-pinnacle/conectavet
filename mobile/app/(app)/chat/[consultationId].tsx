import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, TextInput, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChatBubble } from '@/components/ChatBubble';
import { Card, EmptyState } from '@/components/ui';
import { useConsultationMessages, useConsultation, useConsultationPrescriptions } from '@/hooks/useConsultations';
import { useAuth } from '@/hooks/useAuth';
import { mediaService } from '@/services';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { ApiError } from '@/types';

const SEND_BTN_SIZE = 44;

export default function ConsultationChatScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const { list, send } = useConsultationMessages(consultationId, user?.id);
  const { data: consultation } = useConsultation(consultationId);
  const { data: prescriptions } = useConsultationPrescriptions(consultationId);
  const [draft, setDraft] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const messages = list.data ?? [];
  const rxList = prescriptions ?? [];
  const vetName = consultation?.vet?.firstName || consultation?.vet?.email || 'Veterinario';
  const petName = consultation?.pet?.name || 'Mascota';
  const isActive = consultation?.status === 'ACTIVE';
  const isPending = consultation?.status === 'PENDING';
  const isWaiting = consultation?.status === 'WAITING';
  const statusLabel = isActive ? 'En línea' : isPending ? 'Esperando confirmación' : isWaiting ? 'En cola de espera' : 'Finalizada';
  const statusColor = isActive ? c.success : isPending || isWaiting ? c.accent : c.inkMuted;
  const canChat = isActive;

  const scrollToEnd = useCallback((animated = true) => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated }), 100);
  }, []);

  const onSend = async () => {
    const content = draft.trim();
    if (!content || !canChat || send.isPending || isUploading) return;
    setDraft('');
    try {
      await send.mutateAsync({ content });
      scrollToEnd();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos enviar el mensaje.';
      Toast.show({ type: 'error', text1: 'Error al enviar', text2: msg });
      setDraft(content);
    }
  };

  const pickAndSendImage = async () => {
    if (!canChat || send.isPending || isUploading) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.6,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.uri) return;

      setIsUploading(true);
      const uploaded = await mediaService.upload({
        uri: asset.uri,
        name: asset.fileName ?? `foto-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      await send.mutateAsync({ content: draft.trim(), attachmentUrl: uploaded.url });
      setDraft('');
      scrollToEnd();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No pudimos adjuntar la imagen.';
      Toast.show({ type: 'error', text1: 'Error al enviar imagen', text2: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const renderMessage = useCallback(({ item }: { item: any }) => (
    <ChatBubble
      message={item}
      isOwn={item.senderId === user?.id || item.sender?.id === user?.id}
      senderName={vetName}
    />
  ), [user?.id, vetName]);

  const keyboardProps = useMemo((): any => Platform.select({
    ios: { behavior: 'padding', keyboardVerticalOffset: 0 },
    android: { behavior: 'height' },
    default: { behavior: 'height' },
  }), []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      {...keyboardProps}
    >
      {/* Header with safe area */}
      <View style={{ paddingTop: insets.top, backgroundColor: c.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomColor: c.borderLight, borderBottomWidth: 1 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver">
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.ink} />
          </Pressable>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
            <MaterialCommunityIcons name="stethoscope" size={18} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.ink }} numberOfLines={1}>
              {vetName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
              <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>
                {statusLabel}
              </Text>
            </View>
          </View>
          {consultation?.pet && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>Mascota</Text>
              <Text style={{ fontSize: fontSizes.label, fontWeight: fontWeights.semibold, color: c.ink }}>{petName}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Messages */}
      {list.isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={c.primary} size="small" />
        </View>
      ) : list.isError ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          <EmptyState
            icon="alert-circle-outline"
            title="Error al cargar mensajes"
            subtitle="No pudimos cargar la conversación. Revisá tu conexión."
            ctaLabel="Reintentar"
            onCta={() => list.refetch()}
          />
        </View>
      ) : messages.length === 0 ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          <Card style={{ alignItems: 'center', padding: spacing.xxl }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
              <MaterialCommunityIcons name="chat-processing-outline" size={28} color={c.primary} />
            </View>
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, marginBottom: spacing.sm, textAlign: 'center' }}>
              Consultá con {vetName}
            </Text>
            {consultation?.notes ? (
              <View style={{ backgroundColor: c.primaryBg, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, width: '100%' }}>
                <Text style={{ fontSize: fontSizes.caption, color: c.primary, fontWeight: fontWeights.semibold, marginBottom: spacing.xs }}>
                  Motivo de consulta
                </Text>
                <Text style={{ fontSize: fontSizes.body, color: c.ink, lineHeight: 20 }}>
                  {consultation.notes}
                </Text>
              </View>
            ) : null}
            <Text style={{ fontSize: fontSizes.body, color: c.inkSoft, textAlign: 'center', lineHeight: 20 }}>
              {isActive
                ? 'Escribí tu mensaje. El veterinario te responderá a la brevedad.'
                : isPending
                  ? 'El veterinario está revisando tu consulta. Cuando la acepte, van a poder chatear.'
                  : isWaiting
                    ? 'Estás en la cola de espera. En cuanto un veterinario tome tu consulta, vas a poder escribir.'
                    : 'Esta consulta ya fue finalizada.'}
            </Text>
          </Card>
        </Animated.View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}
          onContentSizeChange={() => scrollToEnd(false)}
          keyboardShouldPersistTaps="handled"
          renderItem={renderMessage}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          updateCellsBatchingPeriod={50}
          ListHeaderComponent={
            <View>
              {(isPending || isWaiting) && (
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
                    backgroundColor: c.accentBg, borderRadius: radius.lg,
                    borderWidth: 1, borderColor: c.accent + '40',
                    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md,
                  }}
                >
                  <MaterialCommunityIcons name={isPending ? 'clock-check-outline' : 'clock-outline'} size={16} color={c.accentDark} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSizes.label, fontWeight: fontWeights.bold, color: c.accentDark, lineHeight: 18 }}>
                      {isPending ? 'Esperando confirmación del veterinario' : 'En cola de espera'}
                    </Text>
                    <Text style={{ fontSize: fontSizes.caption, color: c.inkSoft, lineHeight: 16, marginTop: 2 }}>
                      {isPending
                        ? 'El veterinario está revisando la consulta. Cuando la acepte, van a poder chatear.'
                        : 'Se asignará un veterinario disponible en breve.'}
                    </Text>
                  </View>
                </View>
              )}
              {rxList.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  {rxList.map((rx) => (
                    <View
                      key={rx.id}
                      style={{
                        backgroundColor: c.primaryBg,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: c.primary + '30',
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
                        <MaterialCommunityIcons name="pill" size={16} color={c.primary} />
                        <Text style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: c.primary, textTransform: 'uppercase', flex: 1 }}>
                          Receta de {rx.vet?.firstName || 'tu veterinario'}
                        </Text>
                        <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted }}>
                          {new Date(rx.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={{ fontSize: fontSizes.body, color: c.ink, lineHeight: 20 }}>{rx.content}</Text>
                    </View>
                  ))}
                </View>
              )}
              {consultation?.notes ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: c.primaryBg, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md }}>
                  <MaterialCommunityIcons name="information" size={14} color={c.primary} />
                  <Text style={{ fontSize: fontSizes.caption, color: c.primary, lineHeight: 16, flex: 1 }} numberOfLines={2}>
                    Motivo: {consultation.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          }
        />
      )}

      {/* Input bar */}
      <View style={{ paddingBottom: keyboardVisible ? 0 : insets.bottom, backgroundColor: c.surface, borderTopColor: c.borderLight, borderTopWidth: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.sm }}>
          <Pressable
            onPress={pickAndSendImage}
            disabled={!canChat || send.isPending || isUploading}
            style={{
              width: SEND_BTN_SIZE, height: SEND_BTN_SIZE, borderRadius: SEND_BTN_SIZE / 2,
              backgroundColor: canChat ? c.primaryBg : c.borderLight,
              justifyContent: 'center', alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Adjuntar imagen"
            accessibilityHint="Elegí una imagen de tu galería para enviarla en el chat"
          >
            {isUploading ? (
              <ActivityIndicator color={c.primary} size="small" />
            ) : (
              <MaterialCommunityIcons name="image-plus" size={22} color={canChat ? c.primary : c.inkMuted} />
            )}
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={canChat ? "Escribí tu mensaje…" : "Chat no habilitado aún"}
            placeholderTextColor={c.inkMuted}
            multiline
            maxLength={2000}
            editable={canChat}
            accessibilityLabel="Mensaje"
            style={{
              flex: 1, minHeight: SEND_BTN_SIZE, maxHeight: 120,
              paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
              backgroundColor: c.background, borderRadius: 22,
              borderWidth: 1, borderColor: c.border,
              fontSize: fontSizes.input, color: c.ink,
              lineHeight: 20,
            }}
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || send.isPending || !canChat}
            style={{
              width: SEND_BTN_SIZE, height: SEND_BTN_SIZE, borderRadius: SEND_BTN_SIZE / 2,
              backgroundColor: draft.trim() && canChat ? c.primary : c.border,
              justifyContent: 'center', alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
          >
            {send.isPending ? (
              <ActivityIndicator color={c.white} size="small" />
            ) : (
              <MaterialCommunityIcons name="send" size={18} color={c.white} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
