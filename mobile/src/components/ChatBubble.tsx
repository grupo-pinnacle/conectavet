import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { AuthImage } from './AuthImage';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn?: boolean;
  senderName?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${time}`;
}

function Avatar({ name, role, size = 32 }: { name: string; role: string; size?: number }) {
  const { colors: c } = useTheme();
  const bg = role === 'VET' || role === 'ADMIN' ? c.primaryBg : c.accentBg;
  const iconColor = role === 'VET' || role === 'ADMIN' ? c.primary : c.accentDark;
  const iconName = role === 'VET' || role === 'ADMIN' ? 'stethoscope' : 'account';
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
      <MaterialCommunityIcons name={iconName} size={size * 0.52} color={iconColor} />
    </View>
  );
}

export function ChatBubble({ message, isOwn = false, senderName = 'Veterinario' }: ChatBubbleProps) {
  const { colors: c } = useTheme();
  const role = message.sender?.role;
  const isOptimistic = message.id.startsWith('optimistic-');

  if (!role || (role !== 'CLIENT' && role !== 'VET' && role !== 'ADMIN')) {
    return (
      <View style={{ alignItems: 'center', marginVertical: spacing.xs }}>
        <View style={{ backgroundColor: c.borderLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: radius.full }}>
          <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, fontStyle: 'italic' }}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        marginVertical: 3,
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        paddingHorizontal: spacing.sm,
      }}
    >
      {/* Avatar column — always show for others, hide for own */}
      <View style={{ width: 30, alignItems: 'center' }}>
        {!isOwn && <Avatar name={senderName} role={role!} size={30} />}
      </View>

      {/* Bubble column */}
      <View style={{ maxWidth: '74%' }}>
        {/* Sender label for received messages */}
        {!isOwn && (
          <Text
            style={{
              fontSize: 11,
              color: role === 'VET' || role === 'ADMIN' ? c.primary : c.accentDark,
              fontWeight: fontWeights.semibold,
              marginBottom: 3,
              marginLeft: 4,
            }}
          >
            {role === 'VET' || role === 'ADMIN' ? senderName : 'Tú'}
          </Text>
        )}

<View
            style={{
              backgroundColor: isOwn ? c.primary : c.surface,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: 20,
              borderBottomRightRadius: isOwn ? 6 : 20,
              borderBottomLeftRadius: isOwn ? 20 : 6,
              borderWidth: isOwn ? 0 : 1,
              borderColor: c.border,
              shadowColor: isOwn ? c.primary : '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isOwn ? 0.08 : 0.04,
              shadowRadius: 3,
              elevation: isOwn ? 2 : 1,
              overflow: 'hidden',
            }}
          >
            {message.attachmentUrl ? (
              <AuthImage
                uri={message.attachmentUrl!}
                style={{
                  width: 220,
                  aspectRatio: 4 / 3,
                  borderRadius: radius.lg,
                  backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : c.borderLight,
                  marginBottom: message.content ? spacing.sm : 0,
                }}
                resizeMode="cover"
                accessibilityLabel="Imagen adjunta en el mensaje"
              />
            ) : null}
            {message.content ? (
              <Text
                style={{
                  color: isOwn ? c.white : c.ink,
                  fontSize: fontSizes.body,
                  lineHeight: 21,
                }}
              >
                {message.content}
              </Text>
            ) : null}

          {/* Timestamp + state row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              marginTop: 6,
            }}
          >
            <Text
              style={{
                color: isOwn ? 'rgba(255,255,255,0.6)' : c.inkMuted,
                fontSize: 10,
              }}
            >
              {formatTime(message.createdAt)}
            </Text>
            {isOwn && (
              isOptimistic ? (
                <MaterialCommunityIcons name="clock-outline" size={11} color="rgba(255,255,255,0.45)" />
              ) : (
                <MaterialCommunityIcons name="check" size={11} color="rgba(255,255,255,0.55)" />
              )
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
