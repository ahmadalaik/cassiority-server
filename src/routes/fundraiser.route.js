import express from "express";
import {
  createCampaign,
  getCampaignsByFundraiser,
  updateCampaign,
} from "../controllers/campaign.controller.js";
import { getDonationsByFundraiser, getDonationsCampaignByFundraiser } from "../controllers/donation.controller.js";
import upload from "../middleware/upload.middleware.js";
import { fundraiserDashboardStats } from "../controllers/dashboard.controller.js";

const fundraiserRouter = express.Router();

// dashboard
fundraiserRouter.get("/dashboard", fundraiserDashboardStats);

// campaigns
fundraiserRouter.get("/campaigns", getCampaignsByFundraiser);
fundraiserRouter.post("/campaigns", upload.single("image"), createCampaign);
fundraiserRouter.put("/campaigns/:campaignId", updateCampaign);

// donations
fundraiserRouter.get("/donations", getDonationsByFundraiser);
fundraiserRouter.get("/donations/:campaignId", getDonationsCampaignByFundraiser);

export default fundraiserRouter;
