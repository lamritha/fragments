// GET /v1/fragments — list fragment ids (or full objects with ?expand=1)
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const expand = req.query.expand === '1';
    logger.debug({ ownerId: req.user, expand }, 'Getting fragments for user');
    const fragments = await Fragment.byUser(req.user, expand);
    logger.info({ count: fragments.length }, 'Got fragments for user');
    return res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error({ err }, 'Error getting fragments');
    return res.status(500).json(createErrorResponse(500, err.message));
  }
};
