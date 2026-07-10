const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments/someid');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments/someid')
      .auth('bad@email.com', 'badpassword');
    expect(res.statusCode).toBe(401);
  });

  test('unknown fragment id returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id')
      .auth('test-user1@fragments-testing.com', 'test-password1');
    expect(res.statusCode).toBe(404);
  });

  test('authenticated user can get an existing plain text fragment by id', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    const id = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('This is a fragment');
    expect(getRes.headers['content-type']).toContain('text/plain');
  });

  test('fragment returned with correct Content-Type', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/markdown')
      .send('# Hello');

    const id = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toContain('text/markdown');
  });

  test('markdown fragment can be converted to html with .html extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/markdown')
      .send('# Hello');

    const id = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toContain('text/html');
    expect(getRes.text).toContain('<h1>Hello</h1>');
  });

  test('unsupported conversion returns 415', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const id = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}.png`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(getRes.statusCode).toBe(415);
  });

  test('unknown extension returns 415', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const id = postRes.body.fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}.xyz`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(getRes.statusCode).toBe(415);
  });
});
