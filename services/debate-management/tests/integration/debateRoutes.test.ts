import request from 'supertest';
import {app} from '../../src/index';

describe('Debate API Integration', () => {
  it('should create a new debate via POST /debate', async () => {
    const res = await request(app)
      .post('/debate')
      .send({ topic: 'Climate Change', type: 'unprofessional' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should get list of debates via GET /debate?status=WAITING', async () => {
    const res = await request(app).get('/debate?status=WAITING');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
