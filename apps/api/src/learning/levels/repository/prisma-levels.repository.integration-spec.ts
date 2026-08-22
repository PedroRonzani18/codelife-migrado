import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { LEVELS_REPOSITORY, type LevelsRepositoryPort } from './levels.repository.port';

const fixture = {
  island: '00000000-0000-4000-8000-000000000301',
  level: '00000000-0000-4000-8000-000000000501',
} as const;

describe('PrismaLevelsRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: LevelsRepositoryPort;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<LevelsRepositoryPort>(LEVELS_REPOSITORY);
  });

  afterAll(async () => moduleRef.close());

  it('loads all ordered slide subtypes from a direct fixture level', async () => {
    const level = await repository.levelById(fixture.level);
    expect(level).toMatchObject({
      id: fixture.level,
      islandId: fixture.island,
      position: 1,
    });
    expect(level?.slides.map((slide) => slide.position)).toEqual([1, 2, 3]);
    expect(level?.slides.map((slide) => slide.type)).toEqual(['TextText', 'TextCode', 'TextImage']);
  });
});
