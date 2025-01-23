// src/routes/api/get.js

const { createSuccessResponse } = require('../../../src/response');

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  res.status(200).json(
    createSuccessResponse({
      fragments: [], // TODO: Replace this with actual fragment data
    })
  );
};
