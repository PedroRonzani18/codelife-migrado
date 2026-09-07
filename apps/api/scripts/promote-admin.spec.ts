import type { PrismaClient } from '@prisma/client';
import { parsePromoteAdminArgs, promoteUserByKey } from './promote-admin';

describe('promote-admin script', () => {
  it('requires an explicit public user key', () => {
    expect(parsePromoteAdminArgs(['--key', 'aluna-demo'])).toBe('aluna-demo');
    expect(() => parsePromoteAdminArgs([])).toThrow('Usage:');
    expect(() => parsePromoteAdminArgs(['--username', 'aluna.demo'])).toThrow('Usage:');
  });

  it('promotes only the explicitly selected user and is idempotent for ADMIN', async () => {
    const findUnique = jest.fn().mockResolvedValue({ key: 'user-key', role: 'USER' });
    const update = jest.fn().mockResolvedValue({ key: 'user-key', role: 'ADMIN' });
    const prisma = { user: { findUnique, update } } as unknown as Pick<PrismaClient, 'user'>;

    await expect(promoteUserByKey(prisma, 'user-key')).resolves.toEqual({ key: 'user-key', role: 'ADMIN' });
    expect(update).toHaveBeenCalledWith({
      where: { key: 'user-key' },
      data: { role: 'ADMIN' },
      select: { key: true, role: true },
    });

    findUnique.mockResolvedValue({ key: 'admin-key', role: 'ADMIN' });
    await expect(promoteUserByKey(prisma, 'admin-key')).resolves.toEqual({ key: 'admin-key', role: 'ADMIN' });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('fails explicitly when the selected user does not exist', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
    } as unknown as Pick<PrismaClient, 'user'>;

    await expect(promoteUserByKey(prisma, 'missing-key')).rejects.toThrow('Usuário missing-key não encontrado');
  });
});
