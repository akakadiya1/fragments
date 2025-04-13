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

    // Fetch the fragment by ID (if needed for further checks)
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    // Delete the fragment (use the static method from Fragment)
    await Fragment.delete(ownerId, id);

    logger.info(`Deleted fragment ${id} for user ${ownerId}`);
    return res.status(204).json({
      status: 'ok',
    }); // 204 No Content (successful delete)
  } catch (err) {
    logger.error(`Error deleting fragment: ${err.message}`);

    // Handle "not found" errors specifically
    if (err.message.includes('not found') || err.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    // Handle all other errors as 500
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
