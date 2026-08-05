// v1 fragments API — list, create, and retrieve fragments
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

const router = express.Router();

// Parse request body as raw bytes only for supported fragment types
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

router.get('/fragments', require('./get'));
router.post('/fragments', rawBody(), require('./post'));
router.get('/fragments/:id', require('./get-by-id'));
router.get('/fragments/:id/info', require('./get-by-id-info'));
router.delete('/fragments/:id', require('./delete'));
router.put('/fragments/:id', rawBody(), require('./put'));

module.exports = router;
