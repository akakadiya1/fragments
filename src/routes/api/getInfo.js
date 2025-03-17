const { createSuccessResponse } = require('../../../src/response');
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

    // Return the fragment metadata
    logger.info(`Retrieved fragment info ${id} for user ${ownerId}`);
    return res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      })
    );
  } catch (err) {
    logger.error(`Error retrieving fragment info: ${err.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
