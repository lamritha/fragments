const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).post('/v1/fragments').send('hello');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('bad@email.com', 'badpassword')
      .send(Buffer.from('hello'));
    expect(res.statusCode).toBe(401);
  });

  test('authenticated user can create a plain text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
  });

  test('response includes all expected fragment properties', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');
    const { fragment } = res.body;
    expect(fragment.id).toBeDefined();
    expect(fragment.ownerId).toBeDefined();
    expect(fragment.created).toBeDefined();
    expect(fragment.updated).toBeDefined();
    expect(fragment.type).toBe('text/plain');
    expect(fragment.size).toBe(18);
  });

  test('response includes a Location header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');
    expect(res.headers.location).toBeDefined();
    expect(res.headers.location).toContain(res.body.fragment.id);
  });

  test('unsupported type returns 415', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'application/msword')
      .send('some data');
    expect(res.statusCode).toBe(415);
  });
});
