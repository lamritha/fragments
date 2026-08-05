const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).delete('/v1/fragments/someid');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .delete('/v1/fragments/someid')
      .auth('bad@email.com', 'badpassword');
    expect(res.statusCode).toBe(401);
  });

  test('unknown fragment id returns 404', async () => {
    const res = await request(app)
      .delete('/v1/fragments/nonexistent-id')
      .auth('test-user1@fragments-testing.com', 'test-password1');
    expect(res.statusCode).toBe(404);
  });

  test('authenticated user can delete an existing fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const id = postRes.body.fragment.id;

    const deleteRes = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');
  });

  test('deleted fragment cannot be retrieved', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('test-user1@fragments-testing.com', 'test-password1')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const id = postRes.body.fragment.id;

    await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('test-user1@fragments-testing.com', 'test-password1');

    expect(getRes.statusCode).toBe(404);
  });
});
