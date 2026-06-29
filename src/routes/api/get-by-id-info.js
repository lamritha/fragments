const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    logger.debug({ ownerId: req.user, id: req.params.id }, 'Getting fragment info by id');
    const fragment = await Fragment.byId(req.user, req.params.id);
    logger.info({ id: req.params.id }, 'Got fragment info');
    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found');
    return res.status(404).json(createErrorResponse(404, err.message));
  }
};
