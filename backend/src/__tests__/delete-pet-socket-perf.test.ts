import { deletePet } from '../modules/pets/pets.service';
import { prisma } from '../shared/prisma';
import { getIO } from '../modules/consultations/chat.gateway';

jest.mock('../shared/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock('../modules/consultations/chat.gateway', () => ({
  getIO: jest.fn(),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedGetIO = getIO as jest.Mock;

describe('deletePet socket performance benchmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('measures socket emit calls and execution time for deleting a pet with multiple active consultations', async () => {
    const numConsultations = 100;
    const affectedConsultations = Array.from({ length: numConsultations }, (_, i) => ({
      id: `cons-${i}`,
      clientId: `client-${i}`,
      vetId: `vet-${i}`,
    }));

    const mockPet = { id: 'pet-perf-1', name: 'Fluffy', deletedAt: new Date() };

    mockedPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        consultation: {
          findMany: jest.fn().mockResolvedValue(affectedConsultations),
          updateMany: jest.fn().mockResolvedValue({ count: numConsultations }),
        },
        pet: {
          update: jest.fn().mockResolvedValue(mockPet),
        },
      });
    });

    const emitFn = jest.fn();
    const toCalls: (string | string[])[] = [];
    const toFn = jest.fn().mockImplementation((roomOrRooms: string | string[]) => {
      toCalls.push(roomOrRooms);
      return { emit: emitFn };
    });

    mockedGetIO.mockReturnValue({ to: toFn });

    const start = performance.now();
    const result = await deletePet('pet-perf-1');
    const duration = performance.now() - start;

    expect(result).toBe(mockPet);
    console.log(`[PERF BENCHMARK] Processed ${numConsultations} consultations in ${duration.toFixed(3)} ms with ${toFn.mock.calls.length} io.to() calls.`);

    // Verify total io.to calls were reduced from 3 * N to 1 * N (array of target rooms per consultation)
    expect(toFn.mock.calls.length).toBe(numConsultations);
    expect(toCalls[0]).toEqual(['consultation:cons-0', 'user:client-0', 'user:vet-0']);
  });
});
