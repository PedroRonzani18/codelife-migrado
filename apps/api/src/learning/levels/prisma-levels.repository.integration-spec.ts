import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { ILevelsRepository } from './levels.repository.interface';

const fixture = {
  island: '00000000-0000-4000-8000-000000000301',
  level: '00000000-0000-4000-8000-000000000501',
} as const;

describe('PrismaLevelsRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: ILevelsRepository;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<ILevelsRepository>(LEARNING_PROVIDER_KEYS.LEVELS_REPOSITORY);
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
