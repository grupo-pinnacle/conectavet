import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, Badge } from './ui';
import { useTheme, spacing, radius, fontSizes, fontWeights, statusColors, statusLabel, statusBgColors } from '@/theme';
import { formatWaitTime } from '@/utils/format';
import type { QueueEntry } from '@/types';

interface QueueStatusProps {
  entry: QueueEntry | null;
  onCancel: () => void;
  onJoinCall?: () => void;
  isCancelling?: boolean;
}

export function QueueStatus({ entry, onCancel, onJoinCall, isCancelling }: QueueStatusProps) {
  const { colors: c } = useTheme();
  const [, force] = useState(0);

  useEffect(() => {
    if (!entry || entry.status !== 'WAITING') return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [entry]);

  if (!entry) {
    return (
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
          <MaterialCommunityIcons name="clock-outline" size={24} color={c.inkMuted} />
          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.semibold, color: c.ink }}>
            No estás en la cola
          </Text>
        </View>
        <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, lineHeight: 20 }}>
          Seleccioná una mascota y describí el motivo para unirte a la cola de espera.
        </Text>
      </Card>
    );
  }

  const statusColorKey = statusColors[entry.status] ?? 'primary';
  const statusBgColorKey = statusBgColors[entry.status] ?? 'primaryBg';
  const statusColor = c[statusColorKey];
  const statusBgColor = c[statusBgColorKey];
  const showJoinCall = entry.status === 'ASSIGNED' && entry.livekitToken && entry.livekitRoomName && onJoinCall;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MaterialCommunityIcons
            name={entry.status === 'WAITING' ? 'timer-sand' : 'stethoscope'}
            size={22}
            color={statusColor}
          />
          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>
            Tu consulta
          </Text>
        </View>
        <Badge label={statusLabel[entry.status] ?? entry.status} variant="soft" bg={statusBgColor} color={statusColor} />
      </View>

      {entry.status === 'WAITING' && (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.borderLight }}>
            <Text style={{ fontSize: fontSizes.body, color: c.inkMuted }}>Posición en cola</Text>
            <View style={{ backgroundColor: c.primaryBg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full }}>
              <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: c.primary }}>#{entry.position ?? '?'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: fontSizes.body, color: c.inkMuted }}>Tiempo de espera</Text>
            <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.accentDark }}>
              {formatWaitTime(entry.joinedAt)}
            </Text>
          </View>
          <Button variant="danger" onPress={onCancel} loading={isCancelling} size="md" fullWidth>
            Cancelar espera
          </Button>
        </View>
      )}

      {entry.status === 'ASSIGNED' && (
        <View style={{ gap: spacing.lg }}>
          <View style={{ backgroundColor: c.successBg, borderRadius: radius.lg, padding: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <MaterialCommunityIcons name="stethoscope" size={20} color={c.successDark} />
              <Text style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: c.successDark }}>
                Veterinario asignado
              </Text>
            </View>
            <Text style={{ fontSize: fontSizes.body, color: c.inkSoft, lineHeight: 20 }}>
              Un veterinario te está esperando. Entrá a la videollamada lo antes posible.
            </Text>
          </View>
          {showJoinCall && (
            <Button variant="primary" onPress={onJoinCall!} size="lg" fullWidth icon={<MaterialCommunityIcons name="video" size={20} color={c.white} />}>
              Iniciar videollamada
            </Button>
          )}
          <Button variant="ghost" onPress={onCancel} loading={isCancelling} size="md" fullWidth>
            Cancelar consulta
          </Button>
        </View>
      )}

      {entry.status === 'IN_CONSULTATION' && (
        <View style={{ gap: spacing.lg }}>
          <Text style={{ fontSize: fontSizes.body, color: c.inkSoft, lineHeight: 20 }}>
            Consulta en curso. Volvé a la pantalla de videollamada para continuar.
          </Text>
          {showJoinCall && (
            <Button variant="primary" onPress={onJoinCall!} size="lg" fullWidth icon={<MaterialCommunityIcons name="video" size={20} color={c.white} />}>
              Volver a la videollamada
            </Button>
          )}
        </View>
      )}

      {(entry.status === 'COMPLETED' || entry.status === 'CANCELLED') && (
        <Text style={{ fontSize: fontSizes.body, color: c.inkMuted }}>
          Esta consulta ya finalizó.
        </Text>
      )}
    </Card>
  );
}
