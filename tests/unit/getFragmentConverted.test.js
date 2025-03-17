const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const markdownIt = require('markdown-it')();

describe('GET /v1/fragments/:id/:ext', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/some-id/html').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/some-id/html')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('retrieving a non-existent fragment returns 404', async () => {
    jest.spyOn(Fragment, 'byId').mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/fragments/non-existent-id/html')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Fragment not found'); // Updated key from 'message' to 'error'
  });

  test('retrieving a non-Markdown fragment returns 415', async () => {
    const mockFragment = {
      id: 'existing-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      getData: jest.fn().mockResolvedValue('This is a plain text fragment.'),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .get(`/v1/fragments/${mockFragment.id}/html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body).toHaveProperty('error', 'Unsupported fragment type for conversion'); // Updated key
  });

  test('requesting an unsupported conversion type returns 415', async () => {
    const mockFragment = {
      id: 'existing-id',
      ownerId: 'user1@email.com',
      type: 'text/markdown',
      getData: jest.fn().mockResolvedValue('# Markdown Title'),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .get(`/v1/fragments/${mockFragment.id}/unsupported`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body).toHaveProperty('error', 'Unsupported conversion type'); // Updated key
  });

  test('successfully converts Markdown to HTML', async () => {
    const markdownContent = '# Markdown Title';
    const htmlContent = markdownIt.render(markdownContent);

    const mockFragment = {
      id: 'existing-id',
      ownerId: 'user1@email.com',
      type: 'text/markdown',
      getData: jest.fn().mockResolvedValue(markdownContent),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .get(`/v1/fragments/${mockFragment.id}/html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text.trim()).toBe(htmlContent.trim());
    expect(res.headers['content-type']).toContain('text/html'); // Allow for charset=utf-8
  });

  test('handles internal errors gracefully', async () => {
    jest.spyOn(Fragment, 'byId').mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .get('/v1/fragments/some-id/html')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal Server Error'); // Updated key
  });
});
