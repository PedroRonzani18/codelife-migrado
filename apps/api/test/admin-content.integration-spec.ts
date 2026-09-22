import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import sharp from 'sharp';
import { apiErrorSchema } from '@codelife/contracts/errors';
import {
  adminContentTreeSchema,
  adminIslandDetailSchema,
  adminLevelDetailSchema,
  adminSlideDetailSchema,
} from '@codelife/contracts/content-management';
import { mediaAssetSummarySchema } from '@codelife/contracts/learning';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { LEARNING_PROVIDER_KEYS } from '../src/learning/constants/provider-keys';
import type { IObjectStorage } from '../src/learning/media/object-storage.interface';

const testUsers = {
  admin: { id: '00000000-0000-4000-8000-000000002201', key: 'admin-content-a', username: 'admin-content-a', displayName: 'Admin Content A' },
  student: { id: '00000000-0000-4000-8000-000000002202', key: 'student-content-b', username: 'student-content-b', displayName: 'Student Content B' },
} as const;

describe('administrative content & media API (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let storage: IObjectStorage;
  let cookieName: string;
  let origin: string;
  const createdMediaKeys: string[] = [];
  const createdMediaIds: string[] = [];

  const cookie = async (userId: string) => `${cookieName}=${await jwt.signAsync({ sub: userId })}`;

  async function cleanTestData() {
    if (storage && createdMediaKeys.length > 0) {
      for (const key of createdMediaKeys) {
        await storage.deleteMediaObject(key).catch(() => {});
      }
      createdMediaKeys.length = 0;
    }

    if (createdMediaIds.length > 0) {
      await prisma.mediaAsset.deleteMany({ where: { id: { in: createdMediaIds } } });
      createdMediaIds.length = 0;
    }

    // Clean progress created for test users
    const userIds = [testUsers.admin.id, testUsers.student.id];
    await prisma.userLevelProgress.deleteMany({ where: { userIslandProgress: { userId: { in: userIds } } } });
    await prisma.userIslandProgress.deleteMany({ where: { userId: { in: userIds } } });

    // Clean test islands (slugs starting with test-)
    const testIslands = await prisma.island.findMany({
      where: { slug: { startsWith: 'test-' } },
      select: { id: true },
    });
    const islandIds = testIslands.map((i) => i.id);
    if (islandIds.length > 0) {
      const levels = await prisma.level.findMany({
        where: { islandId: { in: islandIds } },
        select: { id: true },
      });
      const levelIds = levels.map((l) => l.id);
      if (levelIds.length > 0) {
        const slides = await prisma.slide.findMany({
          where: { levelId: { in: levelIds } },
          select: { id: true },
        });
        const slideIds = slides.map((s) => s.id);
        if (slideIds.length > 0) {
          await prisma.textTextSlide.deleteMany({ where: { slideId: { in: slideIds } } });
          await prisma.textImageSlide.deleteMany({ where: { slideId: { in: slideIds } } });
          await prisma.textCodeSlide.deleteMany({ where: { slideId: { in: slideIds } } });
          await prisma.slide.deleteMany({ where: { id: { in: slideIds } } });
        }
        await prisma.level.deleteMany({ where: { id: { in: levelIds } } });
      }
      await prisma.island.deleteMany({ where: { id: { in: islandIds } } });
    }
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(module.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    storage = app.get<IObjectStorage>(LEARNING_PROVIDER_KEYS.OBJECT_STORAGE);
    const config = app.get(ConfigService);
    cookieName = config.getOrThrow('cookieName');
    origin = config.getOrThrow('webOrigin');

    await cleanTestData();
    await prisma.user.upsert({
      where: { id: testUsers.admin.id },
      create: { ...testUsers.admin, role: 'ADMIN' },
      update: { role: 'ADMIN' },
    });
    await prisma.user.upsert({
      where: { id: testUsers.student.id },
      create: { ...testUsers.student, role: 'USER' },
      update: { role: 'USER' },
    });
  });

  afterAll(async () => {
    await cleanTestData();
    await prisma.user.deleteMany({ where: { id: { in: [testUsers.admin.id, testUsers.student.id] } } });
    await app.close();
  });

  it('enforces RBAC on admin content endpoints', async () => {
    const studentSession = await cookie(testUsers.student.id);
    const adminSession = await cookie(testUsers.admin.id);

    // Unauthenticated
    const unauth = await request(app.getHttpServer()).get('/admin/content/tree').expect(401);
    expect(apiErrorSchema.parse(unauth.body).code).toBe('UNAUTHORIZED');

    // USER role
    const forbidden = await request(app.getHttpServer())
      .get('/admin/content/tree')
      .set('Cookie', studentSession)
      .expect(403);
    expect(apiErrorSchema.parse(forbidden.body).code).toBe('FORBIDDEN');

    // ADMIN role
    const ok = await request(app.getHttpServer())
      .get('/admin/content/tree')
      .set('Cookie', adminSession)
      .expect(200);
    expect(adminContentTreeSchema.parse(ok.body)).toBeDefined();
  });

  it('runs the full lifecycle of content creation, media upload, publication, and deletion', async () => {
    const adminSession = await cookie(testUsers.admin.id);

    // 1. Create Island in Draft
    const createIslandRes = await request(app.getHttpServer())
      .post('/admin/content/islands')
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ title: 'Test Island Alpha', slug: 'test-island-alpha' })
      .expect(201);
    const createdIsland = adminIslandDetailSchema.parse(createIslandRes.body);
    expect(createdIsland.publishedAt).toBeNull();
    expect(createdIsland.title).toBe('Test Island Alpha');

    // 2. Reject duplicate slug
    const dupRes = await request(app.getHttpServer())
      .post('/admin/content/islands')
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ title: 'Duplicate', slug: 'test-island-alpha' })
      .expect(409);
    expect(apiErrorSchema.parse(dupRes.body).code).toBe('UNIQUE_CONFLICT');

    // 3. Stale update check
    const staleRes = await request(app.getHttpServer())
      .patch(`/admin/content/islands/${createdIsland.id}`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({
        title: 'New Title',
        expectedUpdatedAt: '2020-01-01T00:00:00.000Z',
      })
      .expect(409);
    expect(apiErrorSchema.parse(staleRes.body).code).toBe('CONTENT_STALE');

    // 4. Successful update
    const updateRes = await request(app.getHttpServer())
      .patch(`/admin/content/islands/${createdIsland.id}`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({
        title: 'Test Island Updated',
        expectedUpdatedAt: createdIsland.updatedAt,
      })
      .expect(200);
    const updatedIsland = adminIslandDetailSchema.parse(updateRes.body);
    expect(updatedIsland.title).toBe('Test Island Updated');

    // 5. Create Level in Island
    const createLevelRes = await request(app.getHttpServer())
      .post(`/admin/content/islands/${createdIsland.id}/levels`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ title: 'Test Level 1' })
      .expect(201);
    const createdLevel = adminLevelDetailSchema.parse(createLevelRes.body);
    expect(createdLevel.publishedAt).toBeNull();

    // 6. Try to publish level without slides -> CONTENT_NOT_PUBLISHABLE
    const publishEmptyLevel = await request(app.getHttpServer())
      .post(`/admin/content/levels/${createdLevel.id}/publish`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ expectedUpdatedAt: createdLevel.updatedAt })
      .expect(400);
    expect(apiErrorSchema.parse(publishEmptyLevel.body).code).toBe('CONTENT_NOT_PUBLISHABLE');

    // 7. Upload Image via /admin/content/media
    const testPngBuffer = await sharp({
      create: { width: 120, height: 120, channels: 3, background: { r: 10, g: 200, b: 50 } },
    })
      .png()
      .toBuffer();

    const uploadRes = await request(app.getHttpServer())
      .post('/admin/content/media')
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .attach('file', testPngBuffer, 'test-image.png')
      .expect(201);
    const mediaAsset = mediaAssetSummarySchema.parse(uploadRes.body);
    expect(mediaAsset.mimeType).toBe('image/webp');
    expect(mediaAsset.width).toBe(120);
    createdMediaIds.push(mediaAsset.id);
    const uploadedAssetRecord = await prisma.mediaAsset.findUnique({ where: { id: mediaAsset.id } });
    if (uploadedAssetRecord) {
      createdMediaKeys.push(uploadedAssetRecord.objectKey);
    }

    // 8. Create TextImage slide in level
    const createSlideRes = await request(app.getHttpServer())
      .post(`/admin/content/levels/${createdLevel.id}/slides`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({
        type: 'TextImage',
        title: 'Slide com Imagem',
        text: 'Instruções com imagem',
        altText: 'Descrição da imagem',
        mediaAssetId: mediaAsset.id,
      })
      .expect(201);
    const createdSlide = adminSlideDetailSchema.parse(createSlideRes.body);
    expect(createdSlide.type).toBe('TextImage');

    // 9. Publish level now that it has a slide
    const levelDetailBeforePub = await request(app.getHttpServer())
      .get(`/admin/content/levels/${createdLevel.id}`)
      .set('Cookie', adminSession)
      .expect(200);
    const currentLevel = adminLevelDetailSchema.parse(levelDetailBeforePub.body);

    const publishLevelRes = await request(app.getHttpServer())
      .post(`/admin/content/levels/${createdLevel.id}/publish`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ expectedUpdatedAt: currentLevel.updatedAt })
      .expect(200);
    const publishedLevel = adminLevelDetailSchema.parse(publishLevelRes.body);
    expect(publishedLevel.publishedAt).not.toBeNull();

    // 10. Publish island now that it has a published level
    const islandDetailBeforePub = await request(app.getHttpServer())
      .get(`/admin/content/islands/${createdIsland.id}`)
      .set('Cookie', adminSession)
      .expect(200);
    const currentIslandBeforePub = adminIslandDetailSchema.parse(islandDetailBeforePub.body);

    const publishIslandRes = await request(app.getHttpServer())
      .post(`/admin/content/islands/${createdIsland.id}/publish`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ expectedUpdatedAt: currentIslandBeforePub.updatedAt })
      .expect(200);
    const publishedIsland = adminIslandDetailSchema.parse(publishIslandRes.body);
    expect(publishedIsland.publishedAt).not.toBeNull();

    // 11. Published island cannot be deleted directly -> CONTENT_NOT_DRAFT
    const deletePublishedRes = await request(app.getHttpServer())
      .delete(`/admin/content/islands/${createdIsland.id}`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .expect(400);
    expect(apiErrorSchema.parse(deletePublishedRes.body).code).toBe('CONTENT_NOT_DRAFT');

    // 12. Unpublish island and level
    const islandDetailBeforeUnpub = await request(app.getHttpServer())
      .get(`/admin/content/islands/${createdIsland.id}`)
      .set('Cookie', adminSession)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/admin/content/islands/${createdIsland.id}/unpublish`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ expectedUpdatedAt: islandDetailBeforeUnpub.body.updatedAt })
      .expect(200);

    const levelDetailBeforeUnpub = await request(app.getHttpServer())
      .get(`/admin/content/levels/${createdLevel.id}`)
      .set('Cookie', adminSession)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/admin/content/levels/${createdLevel.id}/unpublish`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ expectedUpdatedAt: levelDetailBeforeUnpub.body.updatedAt })
      .expect(200);

    // 13. Delete draft island (cascades slides, level, island atomically)
    await request(app.getHttpServer())
      .delete(`/admin/content/islands/${createdIsland.id}`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .expect(204);

    // Verify it is gone
    await request(app.getHttpServer())
      .get(`/admin/content/islands/${createdIsland.id}`)
      .set('Cookie', adminSession)
      .expect(404);
  });
});
