// Integration tests for GET /v1/fragments
const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password');
    expect(res.statusCode).toBe(401);
  });

  test('authenticated users get a fragments array', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('authenticated users get array containing created fragment id', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const getRes = await request(app)
      .get('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(getRes.body.fragments).toContain(postRes.body.fragment.id);
  });

  test('authenticated users get expanded fragments array with expand=1', async () => {
    await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(typeof res.body.fragments[0]).toBe('object');
    expect(res.body.fragments[0].id).toBeDefined();
    expect(res.body.fragments[0].type).toBeDefined();
  });
});
