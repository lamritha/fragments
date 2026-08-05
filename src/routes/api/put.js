const contentType = require('content-type');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (!Buffer.isBuffer(req.body)) {
      logger.warn({ contentType: req.headers['content-type'] }, 'Unsupported Media Type');
      return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
    }

    const { type } = contentType.parse(req.headers['content-type'] || '');
    logger.debug({ user, id, type }, 'Updating fragment');

    const fragment = await Fragment.byId(user, id);

    if (fragment.mimeType !== type) {
      logger.warn({ existing: fragment.mimeType, requested: type }, 'Content-Type mismatch');
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            `Fragment type cannot be changed. Expected ${fragment.mimeType} but got ${type}`
          )
        );
    }

    await fragment.setData(req.body);
    logger.info({ user, id }, 'Fragment updated');

    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.warn({ err, user, id }, 'Fragment not found');
    return res.status(404).json(createErrorResponse(404, err.message));
  }
};
