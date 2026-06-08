// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Create a router on which to mount our API endpoints
const router = express.Router();

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req.headers['content-type'] || '');
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));
router.post('/fragments', rawBody(), require('./post'));
router.get('/fragments/:id', require('./get-by-id'));
// Other routes (POST, DELETE, etc.) will go here later on...

module.exports = router;
