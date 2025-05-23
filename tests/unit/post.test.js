const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users can create a plain text fragment and location must be returned in the header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.headers['location']).toMatch(/\/v1\/fragments\/[a-f0-9-]+$/);
  });

  test('authenticated users can create a JSON fragment', async () => {
    const data = JSON.stringify({ key: 'value' });

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(data);

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toBe('application/json');
  });

  test('authenticated users can create a fragment with charset in Content-Type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send('This is a fragment');

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toBe('text/plain; charset=utf-8');
  });

  test('authenticated users can create a fragment with a large request body', async () => {
    const largeData = Buffer.alloc(1024 * 1024, 'a'); // 1 MB of data

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(largeData);

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.size).toBe(largeData.length);
  });

  test('returns 400 when request body is empty', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Fragment content cannot be empty');
  });

  test('post returns fragment with all necessary properties', async () => {
    const data = 'This is a fragment';
    const size = Buffer.byteLength(data);
    const type = 'text/plain';

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', type)
      .send(data);

    expect(res.statusCode).toBe(201);

    const { fragment } = res.body;
    expect(fragment).toMatchObject({
      type,
      size,
      ownerId: expect.any(String),
      created: expect.any(String),
      updated: expect.any(String),
    });
  });

  test('returns 415 if Content-Type header is missing', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send('This is a fragment');

    expect(res.statusCode).toBe(415);
    expect(res.body.message).toBe('Unsupported Media Type');
  });

  test('returns 415 for unsupported Content-Type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/unsupported-type')
      .send(Buffer.from('Test Data'));

    expect(res.statusCode).toBe(415);
    expect(res.body.message).toBe('Unsupported Media Type');
  });

  test('handles unexpected server errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error logs in test output
    jest
      .spyOn(require('../../src/model/fragment').Fragment.prototype, 'save')
      .mockImplementation(() => {
        throw new Error('Unexpected Error');
      });

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Test data');

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});
