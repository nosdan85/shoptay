import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/ping (GET)', () => {
    it('should return pong', () => {
      return request(app.getHttpServer())
        .get('/api/ping')
        .expect(200)
        .expect({
          pong: true,
          timestamp: expect.any(Number),
        });
    });
  });

  describe('/api (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('service', 'nosmarket-api');
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });
});
