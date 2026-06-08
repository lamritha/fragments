const stoppable = require('stoppable');
const logger = require('./logger');
const app = require('./app');

const port = parseInt(process.env.PORT || '8080', 10);

// stoppable allows graceful shutdown in tests and production
const server = stoppable(
  app.listen(port, () => {
    logger.info({ port }, 'Server started');
  })
);

module.exports = server;
