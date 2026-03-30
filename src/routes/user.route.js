import express from "express";
import {
  checkFundraiserRoleRequest,
  createFundraiserRoleRequest,
  updateProfile,
} from "../controllers/user.controller.js";
import upload from "../middleware/upload.middleware.js";
import {
  createDonation,
  getAllDonationsByUser,
  getDonationByUser,
} from "../controllers/donation.controller.js";
import { userDashboardStats } from "../controllers/dashboard.controller.js";

const userRouter = express.Router();

// dashboard
userRouter.get("/dashboard", userDashboardStats);

// users
userRouter.patch("/users", upload.single("avatar"), updateProfile);
userRouter.get("/users/fundraiser", checkFundraiserRoleRequest);
userRouter.post("/users/fundraiser", createFundraiserRoleRequest);

// donations
userRouter.get("/donations/", getAllDonationsByUser);
userRouter.post("/donations/:campaignId", upload.single("proof"), createDonation);
userRouter.get("/donations/:donationId", getDonationByUser);

export default userRouter;
