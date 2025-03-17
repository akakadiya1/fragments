// tests/unit/getInfo.test.js
const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const { createSuccessResponse } = require('../../src/response');

describe('GET /v1/fragments/:id/info', () => {
  // Authentication tests
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/some-id/info').expect(401));

  // Credentials test
  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/some-id/info')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Retrieving a non-existent fragment
  test('retrieving metadata for a non-existent fragment returns 404', async () => {
    jest.spyOn(Fragment, 'byId').mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/fragments/non-existent-id/info')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });

  // Retrieving metadata for an existing fragment
  test('retrieving metadata for an existing fragment returns correct fragment info', async () => {
    // Mock fragment data
    const mockFragment = {
      id: 'existing-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 100,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .get(`/v1/fragments/${mockFragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      createSuccessResponse({
        fragment: {
          id: mockFragment.id,
          ownerId: mockFragment.ownerId,
          created: mockFragment.created,
          updated: mockFragment.updated,
          type: mockFragment.type,
          size: mockFragment.size,
        },
      })
    );
  });

  // Handling errors gracefully
  test('handles errors gracefully when database retrieval fails', async () => {
    jest.spyOn(Fragment, 'byId').mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .get('/v1/fragments/some-id/info')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
});
