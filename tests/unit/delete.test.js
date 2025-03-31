const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

describe('DELETE /v1/fragments/:id', () => {
  // Authentication tests
  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/some-id').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .delete('/v1/fragments/some-id')
      .auth('invalid@email.com', 'wrongpassword')
      .expect(401));

  test('deleting a non-existent fragment returns 404', async () => {
    const res = await request(app)
      .delete('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Fragment not found');
  });

  test('successfully deletes an existing fragment', async () => {
    // Mock fragment existence check
    jest.spyOn(Fragment, 'byId').mockResolvedValue({ id: 'existing-id' });

    // Mock successful deletion
    jest.spyOn(Fragment, 'delete').mockResolvedValue();

    const res = await request(app)
      .delete('/v1/fragments/existing-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(204); // 204 No Content means successful deletion
  });

  test('handles errors gracefully when deletion fails', async () => {
    // Mock an error in the delete method
    jest.spyOn(Fragment, 'delete').mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .delete('/v1/fragments/some-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
});
