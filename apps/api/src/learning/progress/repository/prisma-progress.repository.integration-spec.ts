import { Test, type TestingModule } from '@nestjs/testing';
import { fixtureIds } from '../../../../prisma/seed';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { PROGRESS_REPOSITORY, type ProgressRepositoryPort } from './progress.repository.port';

describe('PrismaProgressRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: ProgressRepositoryPort;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get(PROGRESS_REPOSITORY);
    prisma = moduleRef.get(PrismaService);
  });
  afterAll(async () => {
    await prisma.userLevelProgress.deleteMany();
    await prisma.userIslandProgress.deleteMany();
    await moduleRef.close();
  });
  beforeEach(async () => {
    await prisma.userLevelProgress.deleteMany();
    await prisma.userIslandProgress.deleteMany();
  });

  it('creates progress, moves the cursor and completes atomically', async () => {
    await repository.startLevel({ userId: fixtureIds.user, islandId: fixtureIds.island, levelId: fixtureIds.levels[0], firstSlideId: fixtureIds.slides[0] });
    const started = await repository.journeyForUser(fixtureIds.user);
    const islandProgress = started.islands[0].progress!;
    const levelProgress = islandProgress.levels[0];
    await repository.setCurrentSlide({ islandProgressId: islandProgress.id, levelProgressId: levelProgress.id, levelId: fixtureIds.levels[0], slideId: fixtureIds.slides[2] });
    await expect(repository.completeLevel({ levelProgressId: levelProgress.id, currentSlideId: fixtureIds.slides[2], completedAt: new Date() })).resolves.toBe(true);
    await expect(repository.completeLevel({ levelProgressId: levelProgress.id, currentSlideId: fixtureIds.slides[2], completedAt: new Date() })).resolves.toBe(false);
    expect((await repository.journeyForUser(fixtureIds.user)).islands[0].progress?.levels[0].completedAt).toBeInstanceOf(Date);
  });

  it('keeps repeated starts idempotent', async () => {
    await Promise.all(Array.from({ length: 4 }, () => repository.startLevel({ userId: fixtureIds.user, islandId: fixtureIds.island, levelId: fixtureIds.levels[0], firstSlideId: fixtureIds.slides[0] })));
    expect(await prisma.userIslandProgress.count()).toBe(1);
    expect(await prisma.userLevelProgress.count()).toBe(1);
  });
});
