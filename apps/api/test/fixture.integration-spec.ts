import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('experimental foundation (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.API_PORT = '3001';
    process.env.WEB_ORIGIN = 'http://localhost:5173';
    process.env.JWT_SECRET = 'integration-test-secret-only';
    process.env.EXPERIMENTAL_LOGIN_ENABLED = 'true';
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('keeps the 1 × 3 × 3 fixture and differentiates an absent session', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    const login = await request(app.getHttpServer()).post('/auth/experimental-login').expect(201);
    expect(login.headers['set-cookie']).toBeDefined();
    const cookie = login.headers['set-cookie'][0];
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(200, { user: { id: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo' } });
    await request(app.getHttpServer()).get('/learning/fixture-integrity').set('Cookie', cookie).expect(200, { islands: 1, levels: 3, slides: 9, valid: true });
    const island = await request(app.getHttpServer()).get('/learning/islands/island-3').set('Cookie', cookie).expect(200);
    expect(island.body.levels.map((level: { id: string }) => level.id)).toEqual(['island-3-l1', 'island-3-l2', 'island-3-l3']);
  });
});
