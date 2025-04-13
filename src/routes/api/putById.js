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
    const contentType = req.get('Content-Type');

    // Fetch the fragment by ID
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    // Ensure content-type matches the existing fragment
    if (fragment.type !== contentType) {
      logger.warn(`Content-Type mismatch: expected ${fragment.type}, got ${contentType}`);
      return res.status(400).json({ error: 'Content-Type does not match existing fragment' });
    }

    // Replace the fragment's data
    const newData = Buffer.from(req.body);
    await fragment.setData(newData);

    // Return the updated metadata
    logger.info(`Updated fragment ${id} for user ${ownerId}`);
    return res.status(200).json({
      status: 'ok',
      fragment: fragment,
    });
  } catch (err) {
    logger.error(`Error updating fragment: ${err.message}`);

    if (err.message.includes('not found') || err.message.includes('does not exist')) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
