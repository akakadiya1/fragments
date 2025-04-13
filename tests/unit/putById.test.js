const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('PUT /v1/fragments/:id', () => {
  // Authentication tests
  test('unauthenticated requests are denied', () =>
    request(app).put('/v1/fragments/some-id').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .put('/v1/fragments/some-id')
      .auth('invalid@email.com', 'wrongpassword')
      .expect(401));

  test('updating a non-existent fragment returns 404', async () => {
    const res = await request(app)
      .put('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1')
      .send({ data: 'Updated data' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });

  test('successfully updates an existing fragment and returns updated data', async () => {
    const mockFragment = {
      id: 'existing-id',
      type: 'text/plain',
      setData: jest.fn(),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/existing-id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Updated data'); // Send as raw string

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
  });

  test('handles errors gracefully when database update fails', async () => {
    const mockFragment = {
      id: 'some-id',
      type: 'text/plain',
      setData: jest.fn(() => {
        throw new Error('Database error');
      }),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/some-id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Updated data');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });

  test('returns 400 if Content-Type does not match the fragment type', async () => {
    const mockFragment = {
      id: 'existing-id',
      type: 'application/json',
      setData: jest.fn(),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .put('/v1/fragments/existing-id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain') // Wrong type
      .send('Invalid data format');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Content-Type does not match existing fragment');
  });
});
