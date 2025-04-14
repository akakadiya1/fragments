const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    if (!ownerId) {
      logger.warn('Unauthorized request: No user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, ext } = req.params;
    logger.info(`Requested fragment ID: ${id}, extension: ${ext || 'none'}`);

    // Fetch the fragment
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      logger.error(`Fragment not found: ${id}`);
      return res.status(404).json({ error: 'Fragment not found' });
    }

    logger.debug(`Fragment found: ${JSON.stringify(fragment, null, 2)}`);

    // Check if conversion is supported
    const targetType = getMimeTypeFromExtension(ext);
    if (!targetType) {
      logger.error(`Unsupported extension: ${ext}`);
      return res.status(415).json({ error: 'Unsupported conversion type' });
    }

    // Verify the conversion is allowed for this fragment type
    if (!fragment.formats.includes(targetType)) {
      logger.error(`Unsupported conversion from ${fragment.type} to ${targetType}`);
      return res.status(415).json({
        error: 'Unsupported conversion',
        supportedFormats: fragment.formats,
      });
    }

    // Perform the conversion
    const convertedData = await fragment.getConvertedInto(`.${ext}`);

    // Set appropriate headers
    res.setHeader('Content-Type', targetType);
    res.setHeader('Content-Length', convertedData.length);

    logger.info(`Successfully converted fragment ${id} to ${targetType} for user ${ownerId}`);
    return res.status(200).send(convertedData);
  } catch (err) {
    logger.error(`Error converting fragment: ${err.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to map extensions to MIME types
function getMimeTypeFromExtension(ext) {
  const extensionMap = {
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    csv: 'text/csv',
    json: 'application/json',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
  };
  return extensionMap[ext.toLowerCase()];
}
