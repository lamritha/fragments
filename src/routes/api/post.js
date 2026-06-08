// POST /v1/fragments — create a new fragment from the raw request body
const contentType = require('content-type');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      logger.warn({ contentType: req.headers['content-type'] }, 'Unsupported Media Type');
      return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
    }

    const { type } = contentType.parse(req.headers['content-type'] || '');

    if (!Fragment.isSupportedType(type)) {
      logger.warn({ type }, 'Unsupported fragment type');
      return res.status(415).json(createErrorResponse(415, `Unsupported type: ${type}`));
    }

    logger.debug({ ownerId: req.user, type }, 'Creating new fragment');

    const fragment = new Fragment({
      ownerId: req.user,
      type: req.get('Content-Type'),
      size: 0,
    });

    await fragment.save();
    await fragment.setData(req.body);

    const apiUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    logger.info({ fragment }, 'Created new fragment');

    res.setHeader('Location', location);
    return res.status(201).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    return res.status(500).json(createErrorResponse(500, err.message));
  }
};
