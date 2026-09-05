import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { AUTH_PROVIDER_KEYS } from '../constants';
import type { IAuthRepository } from './auth.repository.interface';

describe('PrismaAuthRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: IAuthRepository;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<IAuthRepository>(AUTH_PROVIDER_KEYS.AUTH_REPOSITORY);
  });

  afterAll(async () => moduleRef.close());

  it('loads the seeded identity by stable key and database id', async () => {
    const userByKey = await repository.findUserByKey('aluna-demo');
    expect(userByKey).toEqual(expect.objectContaining({
      key: 'aluna-demo',
      username: 'aluna.demo',
      displayName: 'Aluna Demo',
    }));

    await expect(repository.findUserById(userByKey!.id)).resolves.toEqual(userByKey);
  });
});
