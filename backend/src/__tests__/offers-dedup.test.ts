/**
 * BUG-002 — Deduplicación de ofertas en pendientes del veterinario y notificaciones push.
 * Unit tests con mocks aislados para validar unicidad estricta sin efectos colaterales.
 */
import { getConsultationsByUser } from '../modules/consultations/consultations.service';
import { notifyUser, notifyVetsOnline } from '../modules/notifications/notifications.service';
import { prisma } from '../shared/prisma';

jest.mock('../shared/prisma', () => ({
  prisma: {
    consultation: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    pushToken: {
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../modules/consultations/chat.gateway', () => ({
  getIO: jest.fn(() => ({
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
}));

// Mock global fetch para sendExpoPush
const originalFetch = global.fetch;
let mockFetch: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUSH_DISABLED = 'false';
  mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({}),
  });
  global.fetch = mockFetch;
});

afterAll(() => {
  process.env.EXPO_PUSH_DISABLED = 'true';
  global.fetch = originalFetch;
});

describe('BUG-002 Backend — getConsultationsByUser unicidad para VET', () => {
  it('retorna exactamente 5 consultas únicas cuando Prisma devuelve 5 ofertas pendientes', async () => {
    const fiveOffers = [
      { id: 'c-1', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-2', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-3', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-4', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-5', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
    ];

    (prisma.consultation.findMany as jest.Mock).mockResolvedValue(fiveOffers);
    (prisma.consultation.count as jest.Mock).mockResolvedValue(5);

    const result = await getConsultationsByUser('vet-1', 'VET');

    expect(result.data).toHaveLength(5);
    const ids = result.data.map((c: any) => c.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('deduplica defensivamente si la consulta de base de datos retornara registros repetidos', async () => {
    const duplicatedOffers = [
      { id: 'c-1', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-1', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-2', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-3', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-4', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
      { id: 'c-5', vetId: 'vet-1', status: 'PENDING', createdAt: new Date() },
    ];

    (prisma.consultation.findMany as jest.Mock).mockResolvedValue(duplicatedOffers);
    (prisma.consultation.count as jest.Mock).mockResolvedValue(5);

    const result = await getConsultationsByUser('vet-1', 'VET');

    expect(result.data).toHaveLength(5);
    const uniqueIds = Array.from(new Set(result.data.map((c: any) => c.id)));
    expect(uniqueIds).toEqual(['c-1', 'c-2', 'c-3', 'c-4', 'c-5']);
  });
});

describe('BUG-002 Backend — Deduplicación de tokens Expo Push', () => {
  it('notifyUser deduplica tokens idénticos antes de invocar Expo Push', async () => {
    (prisma.notification.create as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      userId: 'vet-1',
      type: 'consultation_offer',
      title: 'Nueva oferta',
      body: 'Detalle',
    });

    // Simulamos que el usuario tiene tokens duplicados en BD
    (prisma.pushToken.findMany as jest.Mock).mockResolvedValue([
      { token: 'ExponentPushToken[device-aaa]' },
      { token: 'ExponentPushToken[device-aaa]' },
      { token: 'ExponentPushToken[device-bbb]' },
    ]);

    await notifyUser('vet-1', 'consultation_offer', 'Nueva oferta', 'Tenés una consulta asignada', { consultationId: 'c-1' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchCallBody).toHaveLength(2);
    expect(fetchCallBody.map((m: any) => m.to)).toEqual([
      'ExponentPushToken[device-aaa]',
      'ExponentPushToken[device-bbb]',
    ]);
  });

  it('notifyVetsOnline deduplica tokens entre múltiples veterinarios antes de invocar Expo Push', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'vet-1' },
      { id: 'vet-2' },
    ]);
    (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

    (prisma.pushToken.findMany as jest.Mock).mockResolvedValue([
      { token: 'ExponentPushToken[shared-device]' },
      { token: 'ExponentPushToken[shared-device]' },
      { token: 'ExponentPushToken[vet2-device]' },
    ]);

    await notifyVetsOnline('consultation_new', 'Nueva consulta', 'En cola', { consultationId: 'c-2' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchCallBody).toHaveLength(2);
    expect(fetchCallBody.map((m: any) => m.to)).toEqual([
      'ExponentPushToken[shared-device]',
      'ExponentPushToken[vet2-device]',
    ]);
  });
});
