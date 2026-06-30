import { Text, View } from 'react-native';
import { colors } from '@/theme';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  showFlaggedBanner?: boolean;
}

export function ChatBubble({ message, showFlaggedBanner = true }: ChatBubbleProps) {
  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';

  if (message.role === 'SYSTEM') {
    return (
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Text style={{ fontSize: 12, color: colors.inkMuted, fontStyle: 'italic' }}>
          {message.content}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      {isAssistant && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2,
            marginLeft: 4,
          }}
        >
          <Text style={{ fontSize: 14 }}>🤖</Text>
          <Text style={{ fontSize: 11, color: colors.inkMuted, fontWeight: '600' }}>
            Asistente VetConnect
          </Text>
        </View>
      )}
      <View
        style={{
          maxWidth: '85%',
          backgroundColor: isUser ? colors.primary : colors.surface,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            color: isUser ? '#fff' : colors.ink,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {message.content}
        </Text>
      </View>
      {showFlaggedBanner && message.flagged && (
        <Text style={{ fontSize: 11, color: colors.danger, marginTop: 2, marginHorizontal: 4 }}>
          ⚠ Mensaje marcado por seguridad
        </Text>
      )}
    </View>
  );
}
