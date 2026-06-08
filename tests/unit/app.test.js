// Integration tests for unknown routes (404 handling)
const request = require('supertest');

const app = require('../../src/app');

describe('GET /v2', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v2');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('not found');
    expect(res.body.error.code).toBe(404);
  });
});
