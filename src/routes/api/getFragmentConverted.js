const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const markdownIt = require('markdown-it')(); // Initialize markdown-it

module.exports = async (req, res) => {
  try {
    const ownerId = req.user; // Get authenticated user ID
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

    logger.debug(`Fragment found: ${JSON.stringify(fragment)}`);

    // Ensure fragment is Markdown
    if (fragment.type !== 'text/markdown') {
      logger.error(`Unsupported fragment type: ${fragment.type}`);
      return res.status(415).json({ error: 'Unsupported fragment type for conversion' });
    }

    // Get the Markdown content
    const markdownContent = (await fragment.getData()).toString();
    logger.debug(`Markdown content: ${markdownContent}`);

    // Convert Markdown to HTML only if `.html` is requested
    if (ext === 'html') {
      const htmlContent = markdownIt.render(markdownContent);
      logger.debug(`Converted HTML content: ${htmlContent}`);

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Length', Buffer.byteLength(htmlContent));

      logger.info(`Converted fragment ${id} to HTML for user ${ownerId}`);
      return res.status(200).send(htmlContent);
    } else {
      logger.error(`Unsupported extension: ${ext}`);
      return res.status(415).json({ error: 'Unsupported conversion type' });
    }
  } catch (err) {
    logger.error(`Error converting fragment: ${err.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
