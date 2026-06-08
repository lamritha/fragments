// GET /v1/fragments/:id — return the raw fragment data with its Content-Type
const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    logger.debug({ ownerId: req.user, id: req.params.id }, 'Getting fragment by id');
    const fragment = await Fragment.byId(req.user, req.params.id);
    const data = await fragment.getData();
    logger.info({ id: req.params.id, type: fragment.type }, 'Got fragment by id');
    res.setHeader('Content-Type', fragment.type);
    return res.status(200).send(data);
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found');
    return res.status(404).json(createErrorResponse(404, err.message));
  }
};
