import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.get("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(403)
        .json({ message: "missing or invalid authorization format header" });
    }

    const token = header.replace("Bearer ", "");
    const jwtSecret = process.env.JWT_SECRET;

    const auth = jwt.verify(token, jwtSecret);
    if (!auth) {
      console.log(Date.now(), " failed to verify token");
      return res.status(401).json({ message: "unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user_id },
    });

    if (!user) {
      return res.status(401).json({ message: "unauthorized" });
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

    return res.status(401).json({ message: "unauthorized" });
  }
};
