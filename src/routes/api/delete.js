// src/routes/api/delete.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * Delete a fragment by id for the authenticated user
 */
module.exports = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  try {
    await Fragment.delete(user, id);
    logger.debug({ user, id }, 'Fragment deleted');
    res.status(200).json(createSuccessResponse());
  } catch (err) {
    logger.warn({ err, user, id }, 'Error deleting fragment');
    return next(createErrorResponse(404, err.message));
  }
};
