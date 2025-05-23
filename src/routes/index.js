// src/routes/index.js

const express = require('express');
const { createSuccessResponse } = require('../../src/response');

// version and author from package.json
const { version, author } = require('../../package.json');
const { hostname } = require('os');

// Create a router that we can use to mount our API
const router = express.Router();

// Our authentication middleware
const { authenticate } = require('../auth');

/**
 * Expose all of our API routes on /v1/* to include an API version.
 * Protect them all with middleware so you have to be authenticated
 * in order to access things.
 */
router.use(`/v1`, authenticate(), require('./api'));

const data = {
  author,
  githubUrl: 'https://github.com/akakadiya1/fragments',
  version,
  // Include the hostname in the response
  hostname: hostname(),
};

/**
 * Define a simple health check route. If the server is running
 * we'll respond with a 200 OK.  If not, the server isn't healthy.
 */
router.get('/', (req, res) => {
  // Client's shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');
  // Send a 200 'OK' response
  res.status(200).json(createSuccessResponse(data));
});

module.exports = router;
