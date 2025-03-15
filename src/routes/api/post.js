const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  // Updated after Assignment 1 feedback:
  // Remove Authorization header before logging to prevent exposing sensitive data
  const safeHeaders = { ...req.headers };
  delete safeHeaders.authorization;
  logger.debug('Received POST /fragments request', { headers: safeHeaders });
  try {
    // Extract the Content-Type header from the request
    const contentType = req.get('Content-Type');

    // If Content-Type is missing, return a 415 (Unsupported Media Type) response
    if (!contentType) {
      logger.warn('Missing Content-Type header');
      return res.status(415).json({ status: 'error', message: 'Unsupported Media Type' });
    }

    logger.debug(`Content-Type received: ${contentType}`);

    // Check if the provided Content-Type is valid
    if (!Fragment.isSupportedType(contentType)) {
      logger.warn(`Unsupported content type: ${contentType}`);
      return res.status(415).json({ status: 'error', message: 'Unsupported Media Type' });
    }

    // Check if the request body is empty
    if (!req.body || req.body.length === 0) {
      logger.warn('Empty request body');
      return res.status(400).json({ status: 'error', message: 'Fragment content cannot be empty' });
    }

    // Use the authenticated user ID or a default 'test-user' for testing environments
    const ownerId = req.user || 'test-user';

    // Create a new Fragment instance with metadata
    const fragment = new Fragment({
      ownerId,
      type: contentType,
      size: req.body.length,
    });

    // Save the fragment's metadata to the database
    await fragment.save();

    // Save the actual binary data associated with the fragment
    await fragment.setData(req.body);

    logger.info(`Created new fragment for user ${ownerId}: ${fragment.id}`);

    // Determine the base API URL (use `API_URL` from environment variables or default to localhost)
    let apiUrl = process.env.API_URL || `http://localhost:8080`;

    // Construct the full resource location for the created fragment
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    // Respond with a 201 (Created) status, setting the Location header with the fragment's URL
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
    // Log and return an error if an exception occurs
    logger.error(`Error creating fragment: ${error.message}`);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
