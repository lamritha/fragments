const express = require('express');
const { authenticate } = require('../auth');
const { version, author } = require('../../package.json');
const { createSuccessResponse } = require('../response');

const router = express.Router();

// All /v1 routes require authentication
router.use(`/v1`, authenticate(), require('./api'));

// Public health check — no auth required
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      description: 'fragments service running normally',
      author,
      githubUrl: 'https://github.com/lamritha/fragments',
      version,
      timestamp: new Date().toISOString(),
    })
  );
});

module.exports = router;
