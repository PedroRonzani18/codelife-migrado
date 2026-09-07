import { Test, type TestingModule } from '@nestjs/testing';
import { fixtureIds } from '../../../prisma/seed';
import { AppModule } from '../../app.module';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { IMediaRepository } from './media.repository.interface';

describe('PrismaMediaRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: IMediaRepository;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<IMediaRepository>(LEARNING_PROVIDER_KEYS.MEDIA_REPOSITORY);
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
