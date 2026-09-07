import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { IAdminUsersRepository, AdminUserRecord } from '../../repository/admin-users/admin-users.repository.interface';
import { AdminUsersService } from './admin-users.service';

const records: AdminUserRecord[] = [
  { id: 'admin-database-id', key: 'admin-key', username: 'admin.name', displayName: 'Admin Name', role: 'ADMIN' },
  { id: 'user-database-id', key: 'user-key', username: 'user.name', displayName: 'User Name', role: 'USER' },
];

function setup() {
  const repository: jest.Mocked<IAdminUsersRepository> = {
    listUsers: jest.fn().mockResolvedValue(records),
    findUserByKey: jest.fn(),
    updateUserRoleByKey: jest.fn(),
  };
  return { repository, service: new AdminUsersService(repository) };
}

describe('AdminUsersService', () => {
  it('maps records to the minimal public administrative user shape', async () => {
    const { service } = setup();

    await expect(service.list()).resolves.toEqual([
      { id: 'admin-key', username: 'admin.name', displayName: 'Admin Name', role: 'ADMIN' },
      { id: 'user-key', username: 'user.name', displayName: 'User Name', role: 'USER' },
    ]);
  });

  it('promotes and demotes a different user', async () => {
    const { repository, service } = setup();
    repository.findUserByKey.mockResolvedValue(records[1]);
    repository.updateUserRoleByKey.mockResolvedValue({ ...records[1], role: 'ADMIN' });

    await expect(service.updateRole(records[0].id, records[1].key, { role: 'ADMIN' })).resolves.toEqual({
      id: 'user-key',
      username: 'user.name',
      displayName: 'User Name',
      role: 'ADMIN',
    });
    expect(repository.updateUserRoleByKey).toHaveBeenCalledWith('user-key', 'ADMIN');
  });

  it('rejects self-demotion before updating persistence', async () => {
    const { repository, service } = setup();
    repository.findUserByKey.mockResolvedValue(records[0]);

    await expect(service.updateRole(records[0].id, records[0].key, { role: 'USER' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.updateUserRoleByKey).not.toHaveBeenCalled();
  });

  it('rejects a missing target and keeps invalid input away from persistence', async () => {
    const { repository, service } = setup();
    repository.findUserByKey.mockResolvedValue(null);
    await expect(service.updateRole('actor-id', 'missing-key', { role: 'ADMIN' })).rejects.toBeInstanceOf(NotFoundException);

    await expect(service.updateRole('actor-id', 'missing-key', { role: 'INVALID' } as never)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findUserByKey).toHaveBeenCalledTimes(1);
  });
});
