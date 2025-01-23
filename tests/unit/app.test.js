const request = require('supertest');

const app = require('../../src/app');

describe('404 Middleware', () => {
  // If a request is made to an undefined route, the response should be a 404 error
  it('should return 404 for unknown routes', async () => {
    // Make a GET request to a route that doesn't exist
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      error: {
        message: 'not found',
        code: 404,
      },
    });
  });
});
