// tests/unit/get.test.js
const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments', () => {
  // Authentication tests
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // Credentials test
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Retrieving fragments
  test('retrieving a non-existent fragment returns 404', async () => {
    const res = await request(app)
      .get('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  // test('retrieving a valid fragment by ID returns success', async () => {
  //   // Create a fragment
  //   const createRes = await request(app)
  //     .post('/v1/fragments')
  //     .auth('user1@email.com', 'password1')
  //     .set('Content-Type', 'text/plain')
  //     .send('test fragment');

  //   expect(createRes.statusCode).toBe(201);
  //   const fragmentId = createRes.body.fragment.id;
  //   expect(fragmentId).toBeDefined();

  //   // Retrieve the fragment by ID
  //   const res = await request(app)
  //     .get(`/v1/fragments/${fragmentId}`)
  //     .auth('user1@email.com', 'password1');

  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.status).toBe('ok');
  //   expect(res.body.fragment).toBeDefined();
  //   expect(res.body.fragment.id).toBe(fragmentId);
  // });

  test('retrieving all fragments with expand=1 returns detailed fragment data', async () => {
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBeGreaterThanOrEqual(0);
  });

  test('handles errors gracefully when database retrieval fails', async () => {
    jest.spyOn(Fragment, 'byUser').mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
});
