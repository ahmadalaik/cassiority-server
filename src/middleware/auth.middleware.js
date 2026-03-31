import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
import { sendError } from "../utils/response.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.get("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return sendError(res, "missing or invalid authorization format header", 403);
    }

    const token = header.replace("Bearer ", "");
    const jwtSecret = process.env.JWT_SECRET;

    const auth = jwt.verify(token, jwtSecret);
    if (!auth) {
      console.log(Date.now(), " failed to verify token");
      return sendError(res, "unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user_id },
    });

    if (!user) {
      return sendError(res, "unauthorized", 401);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    };

    next();
  } catch (error) {
    console.log(Date.now(), " : ", error);

    return sendError(res, "unauthorized", 401);
  }
};
