const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).put('/v1/fragments/someid');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .put('/v1/fragments/someid')
      .auth('bad@email.com', 'badpassword');
    expect(res.statusCode).toBe(401);
  });

  test('unknown fragment id returns 404', async () => {
    const res = await request(app)
      .put('/v1/fragments/nonexistent-id')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('updated content');
    expect(res.statusCode).toBe(404);
  });

  test('authenticated user can update an existing fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('original content');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('updated content');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.status).toBe('ok');
    expect(putRes.body.fragment.size).toBe(15);
  });

  test('updated fragment size reflects new data', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello world');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.fragment.size).toBe(11);
  });

  test('changing Content-Type returns 400', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/markdown')
      .send('# hello');

    expect(putRes.statusCode).toBe(400);
  });

  test('unsupported Content-Type returns 415', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'application/msword')
      .send('some data');

    expect(putRes.statusCode).toBe(415);
  });
});
