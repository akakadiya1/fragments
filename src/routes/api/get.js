// src/routes/api/get.js

const { createSuccessResponse } = require('../../../src/response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * Get all fragments for the current user
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    if (!ownerId) {
      logger.warn('Unauthorized request: No user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Assignment 2 requirement:
    // GET /fragments?expand=1 now returns expanded fragment metadata for an authenticated user. See 4.4.1.
    const expand = req.query.expand === '1'; // Check if expand query param is set
    const fragments = await Fragment.byUser(ownerId, expand);

    logger.info(`Retrieved all fragments for user ${ownerId}`);
    return res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error(`Error retrieving fragments: ${err.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
