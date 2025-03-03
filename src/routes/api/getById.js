const { createSuccessResponse } = require('../../../src/response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * Get a specific fragment by ID
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    if (!ownerId) {
      logger.warn('Unauthorized request: No user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const fragment = await Fragment.byId(ownerId, id);

    if (!fragment) {
      logger.info(`Fragment ${id} not found for user ${ownerId}`);
      return res.status(404).json({ error: 'Fragment not found' });
    }

    logger.info(`Retrieved fragment ${id} for user ${ownerId}`);
    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error(`Error retrieving fragment: ${err.message}`);
    return res.status(404).json({ error: err.message });
  }
};
