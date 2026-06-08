// Standard JSON envelope for successful API responses
module.exports.createSuccessResponse = function (data) {
  return {
    status: 'ok',
    ...data,
  };
};

// Standard JSON envelope for error responses
module.exports.createErrorResponse = function (code, message) {
  return {
    status: 'error',
    error: {
      code,
      message,
    },
  };
};
