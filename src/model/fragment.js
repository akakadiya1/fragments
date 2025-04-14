// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

const markdownit = require('markdown-it');
const csv = require('csvtojson');
const sharp = require('sharp');
const yaml = require('js-yaml'); // Import js-yaml for JSON to YAML conversion
const md = markdownit();

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({
    id = randomUUID(),
    ownerId,
    created = new Date().toISOString(),
    updated = new Date().toISOString(),
    type,
    size = 0,
  }) {
    if (!ownerId || !type) {
      throw new Error('ownerId and type are required');
    }
    if (typeof size !== 'number' || size < 0) {
      throw new Error('size must be a non-negative number');
    }
    if (!Fragment.isSupportedType(type)) {
      throw new Error('Unsupported content type');
    }
    this.id = id;
    this.ownerId = ownerId;
    this.created = created;
    this.updated = updated;
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);
    return expand ? fragments.map((f) => new Fragment(f)) : fragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    // TIP: make sure you properly re-create a full Fragment instance after getting from db.
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new Error('Fragment not found');
    }
    return new Fragment(fragment);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    try {
      // Call the deleteFragment function to delete both metadata and data
      await deleteFragment(ownerId, id);
    } catch (err) {
      throw new Error(`Error during fragment deletion: ${err.message}`);
    }
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    // TIP: make sure you update the metadata whenever you change the data, so they match
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    // Write both fragment data and metadata in parallel
    await Promise.all([writeFragmentData(this.ownerId, this.id, data), this.save()]);
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    const validConversions = {
      'text/plain': ['text/plain'],
      'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
      'text/html': ['text/html', 'text/plain'],
      'text/csv': ['text/csv', 'text/plain', 'application/json'],
      'application/json': ['application/json', 'application/yaml', 'text/plain'],
      'application/yaml': ['application/yaml', 'text/plain'],
      'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/jpeg': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/webp': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/avif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/gif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    };
    return validConversions[this.mimeType] || false;
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    // Expand when adding new types
    const supportedTypes = [
      'text/plain',
      'text/plain; charset=utf-8',
      'text/markdown',
      'text/html',
      'text/csv',
      'application/json',
      'application/yaml',
      `image/png`,
      `image/jpeg`,
      `image/webp`,
      `image/gif`,
      `image/avif`,
    ];
    return supportedTypes.includes(contentType.parse(value).type);
  }

  async getConvertedInto(type) {
    const fragmentData = await this.getData();
    const fragmentType = this.type;

    const conversions = {
      'text/plain': {
        '.txt': () => fragmentData,
      },
      'text/markdown': {
        '.md': () => fragmentData,
        '.html': () => md.render(fragmentData.toString('utf8')),
        '.txt': () => fragmentData.toString('utf8'),
      },
      'text/html': {
        '.html': () => fragmentData,
        '.txt': () => fragmentData.toString('utf8'),
      },
      'text/csv': {
        '.csv': () => fragmentData,
        '.txt': () => fragmentData.toString('utf8'),
        '.json': () =>
          csv()
            .fromString(fragmentData.toString('utf8'))
            .then((jsonObj) => {
              return jsonObj;
            }),
      },
      'application/json': {
        '.json': () => fragmentData,
        '.yaml': () => yaml.dump(JSON.parse(fragmentData.toString('utf8'))),
        '.yml': () => yaml.dump(JSON.parse(fragmentData.toString('utf8'))),
        '.txt': () => fragmentData.toString('utf8'),
      },
      'application/yaml': {
        '.yaml': () => fragmentData,
        '.txt': () => fragmentData.toString('utf8'),
      },
      'image/png': {
        '.png': () => fragmentData,
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
      'image/jpeg': {
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': () => fragmentData,
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
      'image/webp': {
        '.webp': () => fragmentData,
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
      'image/avif': {
        '.avif': () => fragmentData,
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.gif': async () => await sharp(fragmentData).gif().toBuffer(),
      },
      'image/gif': {
        '.gif': () => fragmentData,
        '.png': async () => await sharp(fragmentData).png().toBuffer(),
        '.jpg': async () => await sharp(fragmentData).jpeg().toBuffer(),
        '.webp': async () => await sharp(fragmentData).webp().toBuffer(),
        '.avif': async () => await sharp(fragmentData).avif().toBuffer(),
      },
    };

    if (conversions[fragmentType] && conversions[fragmentType][type]) {
      return await conversions[fragmentType][type]();
      // return await sharp(fragmentData).jpeg().toBuffer();
    }

    throw new Error(`Unsupported conversion from ${fragmentType} to ${type}`);
  }
  // Convert fragment data into the received type.
}

module.exports.Fragment = Fragment;
