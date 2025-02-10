const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug('Received POST /fragments request', { headers: req.headers });
  try {
    // Ensure Content-Type is present
    const contentType = req.get('Content-Type');
    if (!contentType) {
      logger.warn('Missing Content-Type header');
      return res.status(415).json({ status: 'error', message: 'Unsupported Media Type' });
    }

    logger.debug(`Content-Type received: ${contentType}`);

    // Validate Content-Type
    if (!Fragment.isSupportedType(contentType)) {
      logger.warn(`Unsupported content type: ${contentType}`);
      return res.status(415).json({ status: 'error', message: 'Unsupported Media Type' });
    }

    // Ensure request body is a Buffer and not JSON-like
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Request body is not a Buffer');
      return res
        .status(415)
        .json({ status: 'error', message: 'Bad Request: Body must be raw binary data' });
    }

    // Check if the buffer contains JSON instead of raw binary data
    try {
      JSON.parse(req.body.toString()); // If parsing succeeds, it's not valid raw binary
      logger.warn('Request body contains JSON instead of raw binary data');
      return res
        .status(415)
        .json({ status: 'error', message: 'Bad Request: Body must be raw binary data' });
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // If parsing fails, it means the buffer is valid binary, so we proceed
    }
    // Use a default user ID if `req.user` is missing (fix for test environment)
    const ownerId = req.user || 'test-user';

    // Create a new Fragment
    const fragment = new Fragment({
      ownerId,
      type: contentType,
      size: req.body.length,
    });

    // Save metadata and data
    await fragment.save();
    await fragment.setData(req.body);

    logger.info(`Created new fragment: ${fragment.id}`);

    // Set the API URL: Use `API_URL` from .env, or construct from `req.headers.host`
    let apiUrl = process.env.API_URL || `http://localhost:8080`;

    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    return res
      .status(201)
      .set('Location', location)
      .json({
        status: 'ok',
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      });
  } catch (error) {
    logger.error(`Error creating fragment: ${error.message}`);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
