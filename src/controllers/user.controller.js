import z from "zod";
import cloudinary from "../utils/cloudinary.js";
import prisma from "../utils/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { updateProfileSchema, updateRoleSchema } from "../utils/schema.js";

export const GetAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return sendSuccess(res, "Success get users", users);
};

export const checkFundraiserRoleRequest = async (req, res) => {
  try {
    const roleRequest = await prisma.roleUpgradeRequests.count({
      where: {
        userId: req.user.id,
      },
    });

    const data = {
      status: roleRequest > 0,
    };

    return sendSuccess(res, "Success check fundraiser role request", data, 200);
  } catch (error) {
    console.log("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "User not found", 404);
    }

    return sendError(res);
  }
};

// request role fundraiser
export const createFundraiserRoleRequest = async (req, res) => {
  try {
    await prisma.roleUpgradeRequests.create({
      data: {
        userId: req.user.id,
        requestedRole: "fundraiser",
      },
    });

    return sendSuccess(res, "Success create fundraiser role request", null, 201);
  } catch (error) {
    console.log("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "User not found", 404);
    }

    return sendError(res);
  }
};

// update role (upgrade or downgrade)
export const updateRole = async (req, res) => {
  const { requestId } = req.params;

  try {
    const parse = updateRoleSchema.safeParse(req.body);
    if (!parse.success) {
      console.log("error parse: ", parse);
      return sendError(res, "Validation failed", 400, z.treeifyError(parse.error));
    }

    const { status, adminNotes } = parse.data;
    const updateRoleData = { processedBy: req.user.id, status };

    if (adminNotes) {
      updateRoleData.adminNotes = adminNotes;
    }

    await prisma.$transaction(async (tx) => {
      const updatedRoleRequest = await tx.roleUpgradeRequests.update({
        where: { id: parseInt(requestId) },
        data: updateRoleData,
      });

      await tx.user.update({
        where: { id: updatedRoleRequest.userId },
        data: { role: updatedRoleRequest.requestedRole },
      });
    });

    return sendSuccess(res, "Update role successfully");
  } catch (error) {
    console.log("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "User not found", 404);
    }

    return sendError(res);
  }
};

// update profile
export const updateProfile = async (req, res) => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) {
      console.log("error parse: ", parse);
      const errorMessage = parse.error.issues.map((err) => `${err.path} - ${err.message}`);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errors: parse.error,
      });
    }

    const { name, password } = parse.data;
    const updateData = {};

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (name) {
      updateData.name = name;
    }

    if (req.file) {
      if (currentUser.imageId) {
        await cloudinary.uploader.destroy(currentUser.imageId);
      }

      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(fileStr, {
        folder: "avatar",
        transformation: [{ width: 300, height: 300 }],
      });

      updateData.image = result.secure_url;
      updateData.imageId = result.public_id;
    }

    if (password) {
      const salt = bcrypt.genSaltSync(10);
      updateData.password = bcrypt.hashSync(password, salt);
    }

    const updateUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    return sendSuccess(res, "User profile updated successfully", updateUser);
    //
  } catch (error) {
    console.log(error);
    if (error.code === "P2025") {
      return sendError(res, "User not found", 404);
    }

    return sendError(res);
  }
};

export const updateAvatar = async (req, res) => {
  try {
    // validation file
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // get current from req.user.id (auth middleware)
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // validation for delete old image
    if (currentUser.imageId) {
      await cloudinary.uploader.destroy(currentUser.imageId);
    }

    // upload image with buffer multer
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(fileStr, {
      folder: "avatar",
      transformation: [
        {
          width: 300,
          height: 300,
        },
      ],
    });

    // update user image and image id in db (table users)
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        image: result.secure_url,
        imageId: result.public_id,
      },
      omit: {
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "success update user photo profile",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    if (error.code === "P2025") {
      return sendError(res, "User not found", 404);
    }

    return sendError(res);
  }
};
