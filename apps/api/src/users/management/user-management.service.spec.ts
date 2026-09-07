import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { IUsersRepository, UserRecord } from '../repository/users.repository.interface';
import { UserManagementService } from './user-management.service';

const records: UserRecord[] = [
  { id: 'admin-database-id', key: 'admin-key', username: 'admin.name', displayName: 'Admin Name', role: 'ADMIN' },
  { id: 'user-database-id', key: 'user-key', username: 'user.name', displayName: 'User Name', role: 'USER' },
];

function setup() {
  const repository: jest.Mocked<IUsersRepository> = {
    findById: jest.fn(),
    findByKey: jest.fn(),
    list: jest.fn().mockResolvedValue(records),
    create: jest.fn(),
    updateRoleByKey: jest.fn(),
  };
  return { repository, service: new UserManagementService(repository) };
}

describe('UserManagementService', () => {
  it('maps records to the minimal public administrative user shape', async () => {
    const { service } = setup();

    await expect(service.list()).resolves.toEqual([
      { id: 'admin-key', username: 'admin.name', displayName: 'Admin Name', role: 'ADMIN' },
      { id: 'user-key', username: 'user.name', displayName: 'User Name', role: 'USER' },
    ]);
  });

  it('promotes and demotes a different user', async () => {
    const { repository, service } = setup();
    repository.findByKey.mockResolvedValue(records[1]);
    repository.updateRoleByKey.mockResolvedValue({ ...records[1], role: 'ADMIN' });

    await expect(service.updateRole(records[0].id, records[1].key, { role: 'ADMIN' })).resolves.toEqual({
      id: 'user-key',
      username: 'user.name',
      displayName: 'User Name',
      role: 'ADMIN',
    });
    expect(repository.updateRoleByKey).toHaveBeenCalledWith('user-key', 'ADMIN');
  });

  it('rejects self-demotion before updating persistence', async () => {
    const { repository, service } = setup();
    repository.findByKey.mockResolvedValue(records[0]);

    await expect(service.updateRole(records[0].id, records[0].key, { role: 'USER' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.updateRoleByKey).not.toHaveBeenCalled();
  });

  it('rejects a missing target and keeps invalid input away from persistence', async () => {
    const { repository, service } = setup();
    repository.findByKey.mockResolvedValue(null);
    await expect(service.updateRole('actor-id', 'missing-key', { role: 'ADMIN' })).rejects.toBeInstanceOf(NotFoundException);

    await expect(service.updateRole('actor-id', 'missing-key', { role: 'INVALID' } as never)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findByKey).toHaveBeenCalledTimes(1);
  });
});
