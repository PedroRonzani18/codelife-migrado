import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from './auth.repository.port';

describe('PrismaAuthRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: AuthRepositoryPort;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<AuthRepositoryPort>(AUTH_REPOSITORY);
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
