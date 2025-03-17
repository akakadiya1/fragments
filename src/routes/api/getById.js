const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user; // Authenticated user ID
    if (!ownerId) {
      logger.warn('Unauthorized request: No user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Fetch the fragment by ID
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    // Fetch the fragment data
    const data = await fragment.getData();

    // Set the Content-Type and Content-Length headers
    res.setHeader('Content-Type', fragment.type);
    res.setHeader('Content-Length', data.length);

    // Return the fragment data
    logger.info(`Retrieved fragment ${id} for user ${ownerId}`);
    return res.status(200).send(data);
  } catch (err) {
    logger.error(`Error retrieving fragment: ${err.message}`);

    // Handle "not found" errors specifically
    if (err.message.includes('not found') || err.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    // Handle all other errors as 500
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
