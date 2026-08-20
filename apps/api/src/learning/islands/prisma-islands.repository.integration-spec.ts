import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { ISLANDS_REPOSITORY, type IslandsRepositoryPort } from './islands.repository.port';

describe('PrismaIslandsRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: IslandsRepositoryPort;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<IslandsRepositoryPort>(ISLANDS_REPOSITORY);
  });

  afterAll(async () => moduleRef.close());

  it('loads the seeded island with levels in pedagogical order', async () => {
    const island = await repository.islandByKey('island-3');
    expect(island).toEqual(expect.objectContaining({ key: 'island-3' }));
    expect(island!.levels.map((level) => level.sortOrder)).toEqual([0, 1, 2]);
    expect(island!.levels.map((level) => level.key)).toEqual([
      'island-3-l1',
      'island-3-l2',
      'island-3-l3',
    ]);
  });
});
