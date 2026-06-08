// Load test env vars (auth config, log level) before running Jest
const path = require('path');
const envFile = path.join(__dirname, 'env.jest');

require('dotenv').config({ path: envFile });

module.exports = {
  verbose: true,
  testTimeout: 5000,
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
