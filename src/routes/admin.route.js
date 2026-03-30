import express from "express";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {
  deleteCampaign,
  getCampaignStats,
  searchCampaign,
} from "../controllers/campaign.controller.js";
import { getAllDonations, updateDonation } from "../controllers/donation.controller.js";
import { listFundraiser } from "../controllers/fundraiser.controller.js";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  getPaymentMethod,
  searchPaymentMethod,
  updatePaymentMethod,
} from "../controllers/payment_method.controller.js";
import { updateRole } from "../controllers/user.controller.js";
import { adminDashboardStats } from "../controllers/dashboard.controller.js";

const adminRouter = express.Router();

// dashboard
adminRouter.get("/dashboard", adminDashboardStats);

// categories
adminRouter.post("/categories", createCategory);
adminRouter.put("/categories/:categoryId", updateCategory);
adminRouter.delete("/categories/:categoryId", deleteCategory);

// payment methods
adminRouter.get("/payment-methods", searchPaymentMethod);
adminRouter.get("/payment-methods/list", getAllPaymentMethods);
adminRouter.post("/payment-methods", createPaymentMethod);
adminRouter.get("/payment-methods/:paymentMethodId", getPaymentMethod);
adminRouter.put("/payemnt-methods/:paymentMethodId", updatePaymentMethod);
adminRouter.delete("/payment-methods/:paymentMethodId", deletePaymentMethod);

// campaign
adminRouter.get("/campaigns", searchCampaign);
adminRouter.delete("/campaigns/:campaignId", deleteCampaign);
adminRouter.get("/campaigns/stats", getCampaignStats);

// donations
adminRouter.get("/donations", getAllDonations);
adminRouter.patch("/donations/:donationId", updateDonation);

// fundraisers
adminRouter.get("/fundraisers", listFundraiser);

// users
adminRouter.patch("/users/role/:requestId", updateRole);

export default adminRouter;
