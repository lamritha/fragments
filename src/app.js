const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const passport = require('passport');
const logger = require('./logger');
const authenticate = require('./auth');
const { createErrorResponse } = require('./response');
const pino = require('pino-http')({ logger });

const app = express();

// Request logging and standard security/performance middleware
app.use(pino);
app.use(helmet());
app.use(cors());
app.use(compression());

// Auth strategy is chosen in auth/index.js based on env vars
passport.use(authenticate.strategy());
app.use(passport.initialize());

app.use('/', require('./routes'));

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Central error handler — logs server errors (5xx) before responding
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  if (status > 499) {
    logger.error({ err }, 'Error processing request');
  }

  res.status(status).json(createErrorResponse(status, message));
});

module.exports = app;
