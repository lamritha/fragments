const path = require('path');
const mime = require('mime-types');
const MarkdownIt = require('markdown-it');
const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const { id, ext } = parseIdAndExt(req.params.id);
    logger.debug({ ownerId: req.user, id, ext }, 'Getting fragment by id');

    const fragment = await Fragment.byId(req.user, id);
    const data = await fragment.getData();

    // No extension — return raw data with original type
    if (!ext) {
      logger.info({ id, type: fragment.type }, 'Got fragment by id');
      res.setHeader('Content-Type', fragment.type);
      return res.status(200).send(data);
    }

    // Extension provided — attempt conversion
    const targetType = mime.lookup(ext);
    if (!targetType) {
      logger.warn({ ext }, 'Unknown extension');
      return res.status(415).json(createErrorResponse(415, `Unknown extension: ${ext}`));
    }

    if (!fragment.formats.includes(targetType)) {
      logger.warn({ mimeType: fragment.mimeType, targetType }, 'Unsupported conversion');
      return res
        .status(415)
        .json(
          createErrorResponse(415, `Cannot convert ${fragment.mimeType} to ${targetType}`)
        );
    }

    const converted = await convertFragment(data, fragment.mimeType, targetType);
    logger.info({ id, from: fragment.mimeType, to: targetType }, 'Converted fragment');
    res.setHeader('Content-Type', targetType);
    return res.status(200).send(converted);
  } catch (err) {
    logger.warn({ err, id: req.params.id }, 'Fragment not found');
    return res.status(404).json(createErrorResponse(404, err.message));
  }
};

function parseIdAndExt(rawId) {
  const ext = path.extname(rawId);
  const id = ext ? rawId.slice(0, -ext.length) : rawId;
  return { id, ext };
}

async function convertFragment(data, fromType, toType) {
  if (fromType === 'text/markdown' && toType === 'text/html') {
    const md = new MarkdownIt();
    return Buffer.from(md.render(data.toString()));
  }

  // For same-type or text conversions, return as-is
  return data;
}
