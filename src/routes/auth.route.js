import express from "express";
import {
  GetCurrentUser,
  Login,
  Logout,
  Refresh,
  Register,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", Register);
authRouter.post("/login", Login);
authRouter.post("/refresh", Refresh);

// protected
authRouter.use(authMiddleware);
authRouter.delete("/logout", Logout);
authRouter.get("/me", GetCurrentUser);

export default authRouter;
