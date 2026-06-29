const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id/info', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments/someid/info');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments/someid/info')
      .auth('bad@email.com', 'badpassword');
    expect(res.statusCode).toBe(401);
  });

  test('unknown fragment id returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id/info')
      .auth('test-user1@fragments-testing.com', 'test-password1');
    expect(res.statusCode).toBe(404);
  });

  test('authenticated user can get fragment info', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    const id = postRes.body.fragment.id;

    const infoRes = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(infoRes.statusCode).toBe(200);
    expect(infoRes.body.status).toBe('ok');
    expect(infoRes.body.fragment.id).toBe(id);
    expect(infoRes.body.fragment.type).toBe('text/plain');
  });
});
