import { sendError } from "../utils/response.js";

export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, "Forbidden: Access Denied", 403);
    }
    next();
  };
};
