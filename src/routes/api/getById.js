// const { createSuccessResponse } = require('../../../src/response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { convertFragment } = require('../../utils/conversionService');

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
    const extension = req.path.split('.').pop();

    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    let data = fragment.data;
    let contentType = fragment.mimeType;

    // Handle conversions if an extension is provided
    if (extension !== id) {
      const converted = await convertFragment(fragment, extension);
      if (!converted) {
        return res.status(415).json({ error: 'Unsupported conversion type' });
      }
      data = converted.data;
      contentType = converted.mimeType;
    }

    // Send raw data with correct Content-Type
    res.setHeader('Content-Type', contentType);
    res.status(200).send(data);

    // logger.info(`Retrieved fragment ${id} for user ${ownerId}`);
    // return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error(`Error retrieving fragment: ${err.message}`);
    return res.status(404).json({ error: err.message });
  }
};
