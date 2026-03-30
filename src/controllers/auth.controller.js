import prisma from "../utils/prisma.js";
import { sendError } from "../utils/response.js";
import { userSchema } from "../utils/schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const Register = async (req, res) => {
  try {
    const parse = userSchema.safeParse(req.body);
    if (!parse.success) {
      const errorMessage = parse.error.issues.map((err) => `${err.path} - ${err.message}`);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: parse.data.email },
    });

    if (user) {
      return sendError(res, "User already exists", 400);
    }

    // hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(parse.data.password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: parse.data.name,
        email: parse.data.email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "Register success",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
      },
    });
  } catch (error) {
    console.log(error);

    return sendError(res);
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, "Email or password is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("---Log: email not registered");
      return sendError(res, "Email not registered", 400);
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return sendError(res, "Email or password is wrong", 400);
    }

    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign({ user_id: user.id }, jwtSecret, { expiresIn: "1h" });

    const refreshToken = crypto.randomUUID().toString();
    const refreshTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiresAt,
      },
    });

    return res.status(200).json({
      message: "login success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.image,
        role: user.role,
        accessToken: token,
        refreshToken,
      },
    });
  } catch (error) {
    console.log(error);

    return sendError(res);
  }
};

export const Refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    console.log("refresh token: ", refreshToken);
    if (!refreshToken) {
      return sendError(res, "Refresh token is required", 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        refreshToken: refreshToken,
      },
    });

    if (!user) {
      console.warn("User not found");
      return res.status(400).json({
        success: false,
        message: "Email not registered",
        data: null,
      });
    }

    if (Date.now() > user.refreshTokenExpiresAt) {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign({ user_id: user.id }, jwtSecret, { expiresIn: "1h" });

    return res.status(200).json({
      message: "Refresh token success",
      data: {
        accessToken: token,
        expiresIn: 60 * 60,
      },
    });
  } catch (error) {
    console.log(error);

    return sendError(res);
  }
};

export const Logout = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      console.warn("User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: "",
        refreshTokenExpiresAt: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Successfully logout",
    });
  } catch (error) {
    console.log(error);

    return sendError(res);
  }
};

export const GetCurrentUser = async (req, res) => {
  return res.status(200).json({
    message: "Success get user",
    data: req.user,
  });
};
