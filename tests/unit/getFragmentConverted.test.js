const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const markdownIt = require('markdown-it')();
const sharp = require('sharp');

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
      formats: ['text/plain'], // Doesn't include HTML
      getConvertedInto: jest.fn(), // Still define it to avoid runtime error
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .get(`/v1/fragments/${mockFragment.id}/html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body).toHaveProperty('error', 'Unsupported conversion');
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
      formats: ['text/markdown', 'text/html'], // Allow conversion to HTML
      getConvertedInto: jest.fn().mockResolvedValue(htmlContent),
    };

    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);

    const res = await request(app)
      .get(`/v1/fragments/${mockFragment.id}/html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text.trim()).toBe(htmlContent.trim());
    expect(res.headers['content-type']).toContain('text/html');
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

describe('Fragment Type Support and Conversion', () => {
  describe('Fragment Type Support and Conversion', () => {
    // Helper function to create buffer from string
    const strToBuffer = (str) => Buffer.from(str, 'utf8');

    describe('isSupportedType', () => {
      const testCases = [
        { type: 'text/plain', expected: true },
        { type: 'text/plain; charset=utf-8', expected: true },
        { type: 'text/markdown', expected: true },
        { type: 'text/html', expected: true },
        { type: 'text/csv', expected: true },
        { type: 'application/json', expected: true },
        { type: 'application/yaml', expected: true },
        { type: 'image/png', expected: true },
        { type: 'image/jpeg', expected: true },
        { type: 'image/webp', expected: true },
        { type: 'image/gif', expected: true },
        { type: 'image/avif', expected: true },
        { type: 'application/xml', expected: false },
        { type: 'video/mp4', expected: false },
      ];

      testCases.forEach(({ type, expected }) => {
        test(`returns ${expected} for ${type}`, () => {
          expect(Fragment.isSupportedType(type)).toBe(expected);
        });
      });
    });

    describe('getConvertedInto', () => {
      let fragment;

      describe('Text Conversions', () => {
        beforeAll(async () => {
          fragment = new Fragment({
            ownerId: 'user1',
            type: 'text/plain',
          });
          await fragment.setData(strToBuffer('Plain text content'));
        });

        test('converts text/plain to .txt', async () => {
          const result = await fragment.getConvertedInto('.txt');
          expect(result.toString()).toBe('Plain text content');
        });

        test('throws error for unsupported text conversion', async () => {
          await expect(fragment.getConvertedInto('.html')).rejects.toThrow(
            'Unsupported conversion'
          );
        });
      });

      describe('Markdown Conversions', () => {
        beforeAll(async () => {
          fragment = new Fragment({
            ownerId: 'user1',
            type: 'text/markdown',
          });
          await fragment.setData(strToBuffer('# Markdown Title'));
        });

        test('converts text/markdown to .md', async () => {
          const result = await fragment.getConvertedInto('.md');
          expect(result.toString()).toBe('# Markdown Title');
        });

        test('converts text/markdown to .html', async () => {
          const result = await fragment.getConvertedInto('.html');
          expect(result).toBe('<h1>Markdown Title</h1>\n');
        });

        test('converts text/markdown to .txt', async () => {
          const result = await fragment.getConvertedInto('.txt');
          expect(result.toString()).toBe('# Markdown Title');
        });
      });

      describe('Image Conversions', () => {
        let pngBuffer;

        beforeAll(async () => {
          pngBuffer = await sharp({
            create: {
              width: 100,
              height: 100,
              channels: 4,
              background: { r: 255, g: 0, b: 0, alpha: 0.5 },
            },
          })
            .png()
            .toBuffer();

          fragment = new Fragment({
            ownerId: 'user1',
            type: 'image/png',
          });
          await fragment.setData(pngBuffer);
        });

        test('converts image/png to .jpg', async () => {
          const result = await fragment.getConvertedInto('.jpg');
          const metadata = await sharp(result).metadata();
          expect(metadata.format).toBe('jpeg');
        });

        test('converts image/png to .webp', async () => {
          const result = await fragment.getConvertedInto('.webp');
          const metadata = await sharp(result).metadata();
          expect(metadata.format).toBe('webp');
        });

        test('maintains image dimensions during conversion', async () => {
          const result = await fragment.getConvertedInto('.jpg');
          const metadata = await sharp(result).metadata();
          expect(metadata.width).toBe(100);
          expect(metadata.height).toBe(100);
        });
      });

      describe('CSV Conversions', () => {
        beforeAll(async () => {
          fragment = new Fragment({
            ownerId: 'user1',
            type: 'text/csv',
          });
          await fragment.setData(strToBuffer('name,age\nJohn,30\nJane,25'));
        });

        test('converts text/csv to .json', async () => {
          const result = await fragment.getConvertedInto('.json');

          // Handle both Buffer and direct array cases for backward compatibility
          let json;
          if (Buffer.isBuffer(result)) {
            json = JSON.parse(result.toString('utf8'));
          } else if (Array.isArray(result)) {
            json = result;
          } else {
            throw new Error(`Unexpected return type: ${typeof result}`);
          }

          expect(json).toEqual([
            { name: 'John', age: '30' },
            { name: 'Jane', age: '25' },
          ]);
        });
      });

      describe('JSON Conversions', () => {
        beforeAll(async () => {
          fragment = new Fragment({
            ownerId: 'user1',
            type: 'application/json',
          });
          await fragment.setData(strToBuffer(JSON.stringify({ key: 'value' })));
        });

        test('converts application/json to .yaml', async () => {
          const result = await fragment.getConvertedInto('.yaml');
          expect(result.toString().trim()).toBe('key: value');
        });

        test('converts application/json to .yml', async () => {
          const result = await fragment.getConvertedInto('.yml');
          expect(result.toString().trim()).toBe('key: value');
        });
      });

      // Image conversions (PNG)
      describe('Image Conversions', () => {
        let pngBuffer;

        beforeAll(async () => {
          pngBuffer = await sharp({
            create: {
              width: 100,
              height: 100,
              channels: 4,
              background: { r: 255, g: 0, b: 0, alpha: 0.5 },
            },
          })
            .png()
            .toBuffer();

          fragment = new Fragment({
            ownerId: 'user1',
            type: 'image/png',
          });
          await fragment.setData(pngBuffer);
        });

        test('converts image/png to .jpg', async () => {
          const result = await fragment.getConvertedInto('.jpg');
          const metadata = await sharp(result).metadata();
          expect(metadata.format).toBe('jpeg');
        });

        test('converts image/png to .webp', async () => {
          const result = await fragment.getConvertedInto('.webp');
          const metadata = await sharp(result).metadata();
          expect(metadata.format).toBe('webp');
        });

        test('maintains image dimensions during conversion', async () => {
          const result = await fragment.getConvertedInto('.jpg');
          const metadata = await sharp(result).metadata();
          expect(metadata.width).toBe(100);
          expect(metadata.height).toBe(100);
        });

        describe('Error Handling', () => {
          test('throws error for unsupported target extension', async () => {
            fragment = new Fragment({
              ownerId: 'user1',
              type: 'text/plain',
            });
            await fragment.setData(strToBuffer('test'));
            await expect(fragment.getConvertedInto('.mp4')).rejects.toThrow(
              'Unsupported conversion'
            );
          });
        });
      });
    });
  });
});

describe('Additional Conversion Tests', () => {
  describe('HTML Conversions', () => {
    let fragment;

    beforeAll(async () => {
      fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/html',
      });
      await fragment.setData(Buffer.from('<h1>Test</h1>'));
    });

    test('returns HTML with .html extension', async () => {
      const result = await fragment.getConvertedInto('.html');
      expect(result.toString()).toBe('<h1>Test</h1>');
    });

    test('converts HTML to text with .txt extension', async () => {
      const result = await fragment.getConvertedInto('.txt');
      expect(result.toString()).toBe('<h1>Test</h1>');
    });
  });

  describe('CSV Conversions', () => {
    let fragment;

    beforeAll(async () => {
      fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/csv',
      });
      await fragment.setData(Buffer.from('name,age\nJohn,30'));
    });

    test('returns CSV with .csv extension', async () => {
      const result = await fragment.getConvertedInto('.csv');
      expect(result.toString()).toBe('name,age\nJohn,30');
    });

    test('converts CSV to text with .txt extension', async () => {
      const result = await fragment.getConvertedInto('.txt');
      expect(result.toString()).toBe('name,age\nJohn,30');
    });
  });

  describe('YAML Conversions', () => {
    let fragment;

    beforeAll(async () => {
      fragment = new Fragment({
        ownerId: 'user1',
        type: 'application/yaml',
      });
      await fragment.setData(Buffer.from('key: value'));
    });

    test('returns YAML with .yaml extension', async () => {
      const result = await fragment.getConvertedInto('.yaml');
      expect(result.toString()).toBe('key: value');
    });

    test('converts YAML to text with .txt extension', async () => {
      const result = await fragment.getConvertedInto('.txt');
      expect(result.toString()).toBe('key: value');
    });
  });

  describe('Image Conversions', () => {
    let pngFragment, jpegFragment, webpFragment, avifFragment, gifFragment;

    beforeAll(async () => {
      // Create test image buffers
      const createTestImage = async () => {
        return sharp({
          create: {
            width: 100,
            height: 100,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 },
          },
        });
      };

      pngFragment = new Fragment({
        ownerId: 'user1',
        type: 'image/png',
      });
      await pngFragment.setData(await (await createTestImage()).png().toBuffer());

      jpegFragment = new Fragment({
        ownerId: 'user1',
        type: 'image/jpeg',
      });
      await jpegFragment.setData(await (await createTestImage()).jpeg().toBuffer());

      webpFragment = new Fragment({
        ownerId: 'user1',
        type: 'image/webp',
      });
      await webpFragment.setData(await (await createTestImage()).webp().toBuffer());

      avifFragment = new Fragment({
        ownerId: 'user1',
        type: 'image/avif',
      });
      await avifFragment.setData(await (await createTestImage()).avif().toBuffer());

      gifFragment = new Fragment({
        ownerId: 'user1',
        type: 'image/gif',
      });
      await gifFragment.setData(await (await createTestImage()).gif().toBuffer());
    });

    // PNG conversions
    test('converts PNG to GIF', async () => {
      const result = await pngFragment.getConvertedInto('.gif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('gif');
    });

    test('converts PNG to AVIF', async () => {
      const result = await pngFragment.getConvertedInto('.avif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('heif'); // sharp reports AVIF as heif
    });

    // JPEG conversions
    test('converts JPEG to PNG', async () => {
      const result = await jpegFragment.getConvertedInto('.png');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('png');
    });

    test('converts JPEG to WebP', async () => {
      const result = await jpegFragment.getConvertedInto('.webp');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('webp');
    });

    test('converts JPEG to GIF', async () => {
      const result = await jpegFragment.getConvertedInto('.gif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('gif');
    });

    test('converts JPEG to AVIF', async () => {
      const result = await jpegFragment.getConvertedInto('.avif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('heif');
    });

    // WebP conversions
    test('converts WebP to PNG', async () => {
      const result = await webpFragment.getConvertedInto('.png');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('png');
    });

    test('converts WebP to JPG', async () => {
      const result = await webpFragment.getConvertedInto('.jpg');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('jpeg');
    });

    test('converts WebP to GIF', async () => {
      const result = await webpFragment.getConvertedInto('.gif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('gif');
    });

    test('converts WebP to AVIF', async () => {
      const result = await webpFragment.getConvertedInto('.avif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('heif');
    });

    // AVIF conversions
    test('converts AVIF to PNG', async () => {
      const result = await avifFragment.getConvertedInto('.png');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('png');
    });

    test('converts AVIF to JPG', async () => {
      const result = await avifFragment.getConvertedInto('.jpg');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('jpeg');
    });

    test('converts AVIF to WebP', async () => {
      const result = await avifFragment.getConvertedInto('.webp');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('webp');
    });

    test('converts AVIF to GIF', async () => {
      const result = await avifFragment.getConvertedInto('.gif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('gif');
    });

    // GIF conversions
    test('converts GIF to PNG', async () => {
      const result = await gifFragment.getConvertedInto('.png');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('png');
    });

    test('converts GIF to JPG', async () => {
      const result = await gifFragment.getConvertedInto('.jpg');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('jpeg');
    });

    test('converts GIF to WebP', async () => {
      const result = await gifFragment.getConvertedInto('.webp');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('webp');
    });

    test('converts GIF to AVIF', async () => {
      const result = await gifFragment.getConvertedInto('.avif');
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe('heif');
    });
  });
});
