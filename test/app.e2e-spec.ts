import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('Bookings (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/bookings (POST) should create a booking', async () => {
    return request(app.getHttpServer())
      .post('/bookings')
      .send({
        propertyId: 'property-id',
        userName: 'John Doe',
        startDate: '2025-08-10',
        endDate: '2025-08-12',
      })
      .expect(201)
      .expect(res => {
        expect(res.body.success).toBe(true);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
