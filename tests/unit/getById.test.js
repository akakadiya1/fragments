// tests/unit/getById.test.js
const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('GET /v1/fragments/:id', () => {
  const ownerId = 'user1@email.com'; // Use the same ownerId for creation and retrieval

  // Authentication tests
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/some-id').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/some-id')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Retrieving fragments
  test('retrieving a non-existent fragment returns 404', async () => {
    const res = await request(app).get('/v1/fragments/non-existent-id').auth(ownerId, 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });

  // test('retrieving an existing fragment returns the fragment metadata', async () => {
  //   // Create a fragment
  //   const fragment = new Fragment({
  //     ownerId,
  //     type: 'text/plain',
  //     size: 18,
  //   });
  //   await fragment.save();
  //   await fragment.setData(Buffer.from('This is a fragment'));

  //   console.log('Fragment created with ID:', fragment.id); // Debug log

  //   // Retrieve the fragment
  //   const res = await request(app).get(`/v1/fragments/${fragment.id}`).auth(ownerId, 'password1');

  //   console.log('Response:', res.statusCode, res.body); // Debug log

  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.status).toBe('ok');
  //   expect(res.body.fragment.id).toBe(fragment.id);
  //   expect(res.body.fragment.ownerId).toBe(ownerId);
  //   expect(res.body.fragment.type).toBe('text/plain');
  //   expect(res.body.fragment.size).toBe(18);
  // });

  test('handles errors gracefully when database retrieval fails', async () => {
    // Mock the Fragment.byId method to throw an error
    jest.spyOn(Fragment, 'byId').mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await request(app).get('/v1/fragments/some-id').auth(ownerId, 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
});
