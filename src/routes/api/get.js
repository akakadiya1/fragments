// src/routes/api/get.js

const { createSuccessResponse } = require('../../../src/response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user or a specific fragment by ID
 */
module.exports = async (req, res) => {
  try {
    // Assuming req.user contains the hashed email
    const ownerId = req.user;

    if (!ownerId) {
      logger.warn('Unauthorized request: No user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract fragment ID from request params
    const { id } = req.params;

    if (id) {
      // Fetch a specific fragment by ID
      const fragment = await Fragment.byId(ownerId, id);
      logger.info(`Retrieved fragment ${id} for user ${ownerId}`);
      return res.status(200).json(createSuccessResponse({ fragment }));
    } else {
      // Fetch all fragments for the user
      const expand = req.query.expand === '1'; // Check if expand query param is set
      const fragments = await Fragment.byUser(ownerId, expand);
      logger.info(`Retrieved all fragments for user ${ownerId}`);
      return res.status(200).json(createSuccessResponse({ fragments }));
    }
  } catch (err) {
    logger.error(`Error retrieving fragments: ${err.message}`);
    return res.status(404).json({ error: err.message });
  }
};
