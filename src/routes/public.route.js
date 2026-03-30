import express from "express";
import { getAllCategories, getCategory } from "../controllers/category.controller.js";
import { getAllPaymentMethods } from "../controllers/payment_method.controller.js";
import { getCampaign, searchCampaign } from "../controllers/campaign.controller.js";

const publicRouter = express.Router();

// categories
publicRouter.get("/categories", getAllCategories);
publicRouter.get("/categories/:categoryId", getCategory);

// payment-methods
publicRouter.get("/payment-methods", getAllPaymentMethods);

// campaigns
publicRouter.get("/campaigns", searchCampaign);
publicRouter.get("/campaigns/:campaignSlug", getCampaign);

export default publicRouter;
