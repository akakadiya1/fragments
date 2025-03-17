// tests/unit/getById.test.js
const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id', () => {
  // Authentication tests
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/some-id').expect(401));

  // Credentials test
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/some-id')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Retrieving a non-existent fragment
  test('retrieving a non-existent fragment returns 404', async () => {
    jest.spyOn(Fragment, 'byId').mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });

  // Retrieving an existing fragment
  test('retrieving an existing fragment returns the fragment data', async () => {
    // Mock fragment data
    const mockFragment = {
      id: 'existing-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 100,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      getData: jest.fn().mockResolvedValue(Buffer.from('Mock Fragment Data')), // Mocking getData
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .get(`/v1/fragments/${mockFragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe(mockFragment.type);
    expect(res.headers['content-length']).toBe(Buffer.from('Mock Fragment Data').length.toString());
    expect(res.text).toBe('Mock Fragment Data');
  });

  // Handling errors gracefully
  test('handles errors gracefully when database retrieval fails', async () => {
    jest.spyOn(Fragment, 'byId').mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .get('/v1/fragments/some-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
});
