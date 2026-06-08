// Hash user emails so owner IDs are safe to store and use in URLs
const crypto = require('crypto');

module.exports = (email) => crypto.createHash('sha256').update(email).digest('hex');
