const { HTTP_STATUS } = require('../constants');

const sendSuccess = (res, data, statusCode = HTTP_STATUS.OK, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date(),
  });
};

const sendError = (res, error, statusCode = HTTP_STATUS.INTERNAL_ERROR) => {
  res.status(statusCode).json({
    success: false,
    error: error.message || 'An error occurred',
    errorType: error.name || 'Error',
    ...(error.errors && { validationErrors: error.errors }),
    timestamp: new Date(),
  });
};

const sendPaginatedSuccess = (res, data, pagination, statusCode = HTTP_STATUS.OK) => {
  res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
    },
    timestamp: new Date(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedSuccess,
};
