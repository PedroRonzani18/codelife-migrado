import { Test, type TestingModule } from '@nestjs/testing';
import { fixtureIds } from '../../../prisma/seed';
import { AppModule } from '../../app.module';
import { MEDIA_REPOSITORY, type MediaRepositoryPort } from './media.repository.port';

describe('PrismaMediaRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: MediaRepositoryPort;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<MediaRepositoryPort>(MEDIA_REPOSITORY);
  });

  afterAll(async () => moduleRef.close());

  it('loads a seeded media asset by id', async () => {
    await expect(repository.mediaAssetById(fixtureIds.assets[0])).resolves.toMatchObject({
      id: fixtureIds.assets[0],
      objectKey: 'learning/island-3/variables.svg',
      mimeType: 'image/svg+xml',
    });
  });
});
