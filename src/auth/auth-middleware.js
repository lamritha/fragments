const passport = require('passport');
const { createErrorResponse } = require('../response');
const hash = require('../hash');
const logger = require('../logger');

// Wraps passport.authenticate; sets req.user to the hashed email on success
module.exports = (strategyName) => {
  return function (req, res, next) {
    function callback(err, email) {
      if (err) {
        logger.warn({ err }, 'error authenticating user');
        return next(createErrorResponse(500, 'Unable to authenticate user'));
      }

      if (!email) {
        return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
      }

      req.user = hash(email);
      logger.debug({ email, hash: req.user }, 'Authenticated user');
      next();
    }

    passport.authenticate(strategyName, { session: false }, callback)(req, res, next);
  };
};
