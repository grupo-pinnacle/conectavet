/**
 * BUG-01 Cerco — cancelController: broadcast triple + contrato REST/socket.
 * Unit puro con mocks: no toca DB, Redis ni sockets reales.
 */
import { cancelController } from '../modules/consultations/consultations.controller';
import { cancelConsultation } from '../modules/consultations/consultations.service';
import { getIO } from '../modules/consultations/chat.gateway';

jest.mock('../modules/consultations/consultations.service', () => ({
  cancelConsultation: jest.fn(),
}));
jest.mock('../modules/consultations/chat.gateway', () => ({
  getIO: jest.fn(),
}));
jest.mock('../modules/notifications', () => ({
  notifyUser: jest.fn(),
  notifyVetsOnline: jest.fn(),
  notifyConsultationMessage: jest.fn(),
}));

const mockedCancel = cancelConsultation as jest.Mock;
const mockedGetIO = getIO as jest.Mock;

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: any = {}) {
  return {
    user: { userId: 'client-1', role: 'CLIENT' },
    params: { id: 'cons-1' },
    body: {},
    ...overrides,
  } as any;
}

function mockIO() {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  (mockedGetIO as jest.Mock).mockReturnValue({ to });
  return { emit, to };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BUG-01 Cerco — cancelController broadcast', () => {
  it('caso feliz con vet: emite a room + client + vet y responde 200 con el mismo payload', async () => {
    const updated = { id: 'cons-1', clientId: 'client-1', vetId: 'vet-9', status: 'CANCELLED' };
    mockedCancel.mockResolvedValue(updated);
    const { emit, to } = mockIO();
    const res = mockRes();

    await cancelController(mockReq(), res, jest.fn());

    expect(mockedCancel).toHaveBeenCalledWith('cons-1', 'client-1');
    const rooms = to.mock.calls.map((c: any[]) => c[0]).sort();
    expect(rooms).toEqual(['consultation:cons-1', 'user:client-1', 'user:vet-9'].sort());
    expect(emit).toHaveBeenCalledTimes(3);
    for (const call of emit.mock.calls) {
      expect(call[0]).toBe('consultation:updated');
      expect(call[1]).toBe(updated);
    }
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('borde WAITING sin vet: emite solo a room + client, nunca a user:null', async () => {
    const updated = { id: 'cons-2', clientId: 'client-1', vetId: null, status: 'CANCELLED' };
    mockedCancel.mockResolvedValue(updated);
    const { emit, to } = mockIO();
    const res = mockRes();

    await cancelController(mockReq({ params: { id: 'cons-2' } }), res, jest.fn());

    const rooms = to.mock.calls.map((c: any[]) => c[0]).sort();
    expect(rooms).toEqual(['consultation:cons-2', 'user:client-1'].sort());
    expect(rooms.every((r: string) => !r.includes('null') && !r.includes('undefined'))).toBe(true);
    expect(emit).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('inválido: rol VET recibe 403 y no toca servicio ni sockets', async () => {
    const { to } = mockIO();
    const res = mockRes();

    await cancelController(mockReq({ user: { userId: 'vet-9', role: 'VET' } }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockedCancel).not.toHaveBeenCalled();
    expect(to).not.toHaveBeenCalled();
  });

  it('frontera contrato socket: evento y payload compatibles con MessagesSection/mobile', async () => {
    const updated = { id: 'cons-3', clientId: 'client-1', vetId: 'vet-9', status: 'CANCELLED' };
    mockedCancel.mockResolvedValue(updated);
    const { emit } = mockIO();
    const res = mockRes();

    await cancelController(mockReq({ params: { id: 'cons-3' } }), res, jest.fn());

    // Los oyentes filtran por consultation.id y aplican patch por id:
    // el payload debe conservar id + status + participantes.
    const [, payload] = emit.mock.calls[0];
    expect(payload.id).toBe('cons-3');
    expect(payload.status).toBe('CANCELLED');
    expect(payload.clientId).toBe('client-1');
    expect(res.json.mock.calls[0][0]).toEqual({ success: true, data: updated });
  });

  it('robustez: sin IO disponible igual responde 200 (no cuelga el PATCH)', async () => {
    const updated = { id: 'cons-4', clientId: 'client-1', vetId: 'vet-9', status: 'CANCELLED' };
    mockedCancel.mockResolvedValue(updated);
    mockedGetIO.mockReturnValue(null);
    const res = mockRes();
    const next = jest.fn();

    await cancelController(mockReq({ params: { id: 'cons-4' } }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('robustez: si el emit lanza, el catch lo absorbe y el PATCH sigue 200', async () => {
    const updated = { id: 'cons-5', clientId: 'client-1', vetId: 'vet-9', status: 'CANCELLED' };
    mockedCancel.mockResolvedValue(updated);
    mockedGetIO.mockReturnValue({
      to: jest.fn().mockImplementation(() => {
        throw new Error('socket caído');
      }),
    });
    const res = mockRes();
    const next = jest.fn();

    await cancelController(mockReq({ params: { id: 'cons-5' } }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });
});
