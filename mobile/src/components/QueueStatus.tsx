import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { colors, statusColors, statusLabel } from '@/theme';
import { formatWaitTime } from '@/utils/format';
import type { QueueEntry } from '@/types';

interface QueueStatusProps {
  entry: QueueEntry | null;
  onCancel: () => void;
  onJoinCall?: () => void;
  isCancelling?: boolean;
}

export function QueueStatus({ entry, onCancel, onJoinCall, isCancelling }: QueueStatusProps) {
  const [, force] = useState(0);

  // Re-render every second so the wait timer ticks while WAITING
  useEffect(() => {
    if (!entry || entry.status !== 'WAITING') return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [entry]);

  if (!entry) {
    return (
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: 4 }}>
          No estás en la cola
        </Text>
        <Text style={{ fontSize: 14, color: colors.inkMuted }}>
          Seleccioná una mascota y describí el motivo para unirte a la cola de espera.
        </Text>
      </Card>
    );
  }

  const bg = statusColors[entry.status] ?? colors.primary;
  const showJoinCall =
    entry.status === 'ASSIGNED' && entry.livekitToken && entry.livekitRoomName && onJoinCall;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>Tu consulta</Text>
        <Badge label={statusLabel[entry.status] ?? entry.status} bg={bg} />
      </View>

      {entry.status === 'WAITING' && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: colors.inkMuted }}>Posición en cola</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
              #{entry.position ?? '?'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: colors.inkMuted }}>Esperando</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accentDark }}>
              {formatWaitTime(entry.joinedAt)}
            </Text>
          </View>
          <Button variant="danger" onPress={onCancel} loading={isCancelling}>
            Cancelar espera
          </Button>
        </>
      )}

      {entry.status === 'ASSIGNED' && (
        <>
          <Text style={{ fontSize: 14, color: colors.ink, marginBottom: 4 }}>
            🩺 Un veterinario te está esperando.
          </Text>
          <Text style={{ fontSize: 13, color: colors.inkMuted, marginBottom: 16 }}>
            Entrá a la videollamada lo antes posible. Si no conectás, la consulta puede
            ser reasignada.
          </Text>
          {showJoinCall && (
            <Button variant="primary" onPress={onJoinCall!}>
              Iniciar videollamada
            </Button>
          )}
          <View style={{ height: 8 }} />
          <Button variant="ghost" onPress={onCancel} loading={isCancelling}>
            Cancelar consulta
          </Button>
        </>
      )}

      {entry.status === 'IN_CONSULTATION' && (
        <>
          <Text style={{ fontSize: 14, color: colors.ink, marginBottom: 16 }}>
            Consulta en curso. Volvé a la pantalla de videollamada para continuar.
          </Text>
          {showJoinCall && (
            <Button variant="primary" onPress={onJoinCall!}>
              Volver a la videollamada
            </Button>
          )}
        </>
      )}

      {(entry.status === 'COMPLETED' || entry.status === 'CANCELLED') && (
        <Text style={{ fontSize: 14, color: colors.inkMuted }}>
          Esta consulta ya finalizó.
        </Text>
      )}
    </Card>
  );
}
