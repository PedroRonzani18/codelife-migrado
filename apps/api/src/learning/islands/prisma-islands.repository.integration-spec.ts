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

  it('loads the seeded direct island in deterministic order', async () => {
    const island = await repository.islandBySlug('island-3');
    expect(island).toEqual(expect.objectContaining({ slug: 'island-3' }));
    expect(island!.levels.map((level) => level.position)).toEqual([1, 2, 3]);
    expect(island!.levels.map((level) => level.id)).toEqual([
      '00000000-0000-4000-8000-000000000501',
      '00000000-0000-4000-8000-000000000502',
      '00000000-0000-4000-8000-000000000503',
    ]);
  });
});
