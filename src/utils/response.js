// Success response helper
const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error response helper
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Pagination helper
const paginationResponse = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

// Validation error response helper
const validationErrorResponse = (res, errors) => {
  const formattedErrors = errors.map(error => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors
  });
};

// Not found response helper
const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`
  });
};

// Unauthorized response helper
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    message
  });
};

// Forbidden response helper
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};

// Bad request response helper
const badRequestResponse = (res, message = 'Bad request') => {
  return res.status(400).json({
    success: false,
    message
  });
};

// Internal server error response helper
const serverErrorResponse = (res, message = 'Internal server error') => {
  return res.status(500).json({
    success: false,
    message
  });
};

// Created response helper
const createdResponse = (res, message, data = null) => {
  return successResponse(res, message, data, 201);
};

// No content response helper
const noContentResponse = (res) => {
  return res.status(204).send();
};

module.exports = {
  successResponse,
  errorResponse,
  paginationResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  serverErrorResponse,
  createdResponse,
  noContentResponse
};