import { batchDeleteUsers } from '../modules/users/users.service';
import { prisma } from '../shared/prisma';

jest.mock('../shared/prisma', () => {
  return {
    prisma: {
      user: {
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      consultation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      pushToken: {
        deleteMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
    },
  };
});

describe('batchDeleteUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('correctly processes users and measures query execution count', async () => {
    const adminId = 'admin-1';
    const userIds = [
      'admin-1', // admin (should be skipped)
      'user-soft-1', // user with consultation (soft delete)
      'user-soft-2', // user with consultation (soft delete)
      'user-hard-1', // user without consultation (hard delete)
      'user-hard-2', // user without consultation (hard delete)
    ];

    const existingUsers = [
      { id: 'user-soft-1', email: 'soft1@test.com' },
      { id: 'user-soft-2', email: 'soft2@test.com' },
      { id: 'user-hard-1', email: 'hard1@test.com' },
      { id: 'user-hard-2', email: 'hard2@test.com' },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(existingUsers);

    (prisma.consultation.findMany as jest.Mock).mockResolvedValue([
      { clientId: 'user-soft-1', vetId: null },
      { clientId: null, vetId: 'user-soft-2' },
    ]);

    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (prisma.user.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.pushToken.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.auditLog.createMany as jest.Mock).mockResolvedValue({ count: 4 });

    const startTime = performance.now();
    await batchDeleteUsers(adminId, userIds);
    const endTime = performance.now();

    const findManyUserCalls = (prisma.user.findMany as jest.Mock).mock.calls.length;
    const findManyConsultationCalls = (prisma.consultation.findMany as jest.Mock).mock.calls.length;
    const pushTokenDeleteManyCalls = (prisma.pushToken.deleteMany as jest.Mock).mock.calls.length;
    const userUpdateCalls = (prisma.user.update as jest.Mock).mock.calls.length;
    const userDeleteManyCalls = (prisma.user.deleteMany as jest.Mock).mock.calls.length;
    const auditLogCreateManyCalls = (prisma.auditLog.createMany as jest.Mock).mock.calls.length;

    const totalQueries =
      findManyUserCalls +
      findManyConsultationCalls +
      pushTokenDeleteManyCalls +
      userUpdateCalls +
      userDeleteManyCalls +
      auditLogCreateManyCalls;

    expect(findManyUserCalls).toBe(1);
    expect(findManyConsultationCalls).toBe(1);
    expect(pushTokenDeleteManyCalls).toBe(1);
    expect(userUpdateCalls).toBe(2); // 2 soft deletes in parallel
    expect(userDeleteManyCalls).toBe(1); // 1 batch hard delete
    expect(auditLogCreateManyCalls).toBe(1); // 1 batch audit log create

    expect((prisma.user.deleteMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: { id: { in: ['user-hard-1', 'user-hard-2'] } },
    });

    expect((prisma.auditLog.createMany as jest.Mock).mock.calls[0][0].data).toEqual([
      { adminId: 'admin-1', action: 'DELETE_USER', targetId: 'user-soft-1', details: { softDeleted: true } },
      { adminId: 'admin-1', action: 'DELETE_USER', targetId: 'user-soft-2', details: { softDeleted: true } },
      { adminId: 'admin-1', action: 'DELETE_USER', targetId: 'user-hard-1', details: { softDeleted: false } },
      { adminId: 'admin-1', action: 'DELETE_USER', targetId: 'user-hard-2', details: { softDeleted: false } },
    ]);

    console.log(`[BENCHMARK OPTIMIZED] Total Prisma Queries: ${totalQueries}`);
    console.log(`[BENCHMARK OPTIMIZED] Duration: ${(endTime - startTime).toFixed(2)} ms`);
  });

  test('returns early if target users list is empty or contains only admin', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'admin-1' }]);

    await batchDeleteUsers('admin-1', ['admin-1']);

    expect(prisma.consultation.findMany).not.toHaveBeenCalled();
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.createMany).not.toHaveBeenCalled();
  });
});
