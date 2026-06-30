import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/theme';

interface InputProps extends Omit<TextInputProps, 'onChangeText'> {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
}

export function Input({ label, error, value, onChangeText, hint, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Text style={{ fontSize: 14, color: colors.ink, fontWeight: '600', marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.inkMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: colors.ink,
        }}
        {...rest}
      />
      {hint && !error && (
        <Text style={{ fontSize: 12, color: colors.inkMuted, marginTop: 4 }}>{hint}</Text>
      )}
      {error && (
        <Text style={{ fontSize: 12, color: colors.danger, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}
