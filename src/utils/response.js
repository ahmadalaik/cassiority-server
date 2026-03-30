export const sendSuccess = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message: message || "Request successful",
    data: data || null,
  });
};

export const sendError = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message: message || "Internal server error",
    errors: errors,
  });
};
