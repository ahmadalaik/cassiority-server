import cloudinary from "../utils/cloudinary.js";
import prisma from "../utils/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { campaignSchema } from "../utils/schema.js";
import { toSlugify } from "../utils/slug.js";

export const createCampaign = async (req, res) => {
  try {
    const parse = campaignSchema.safeParse(req.body);
    if (!parse.success) {
      console.log("parse error: ", parse.error);
      return res.status(400).json({
        success: false,
        message: parse.error.issues.map((err) => `${err.path} - ${err.message}`),
        data: null,
      });
    }

    let imageData = {};
    if (req.file) {
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder: "campaigns",
      });

      imageData = {
        image: uploadResponse.secure_url,
        imageId: uploadResponse.public_id,
      };
    }

    const { title, category, ...rest } = parse.data;
    const campaignCategory = await prisma.category.findFirst({
      where: { name: category.name },
    });
    console.log("target amount: ", parse.data.targetAmount);

    const campaign = await prisma.campaign.create({
      data: {
        ...rest,
        title,
        slug: toSlugify(title),
        userId: req.user.id,
        categoryId: campaignCategory.id,
        ...imageData,
      },
    });

    return sendSuccess(res, "Campaign created successfully", campaign, 201);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const updateCampaign = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const parse = campaignSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        message: parse.error.issues.map((err) => `${err.path} - ${err.message}`),
        data: null,
      });
    }

    let imageData = {};
    if (req.file) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: parseInt(campaignId), userId: req.user.id },
        select: { imageId: true },
      });

      // delete old image if exists
      if (campaign.imageId) {
        await cloudinary.uploader.destroy(campaign.imageId);
      }

      // upload new image
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder: "campaigns",
      });

      imageData = {
        image: uploadResponse.secure_url,
        imageId: uploadResponse.public_id,
      };
    }

    const { title, ...rest } = parse.data;
    const updated = await prisma.campaign.update({
      where: { id: parseInt(campaignId), userId: req.user.id },
      data: {
        ...rest,
        title,
        slug: toSlugify(title),
        ...imageData,
      },
    });

    return sendSuccess(res, "Campaign updated successfully", updated);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Campaign not found", 404);
    }

    return sendError(res);
  }
};

export const getCampaign = async (req, res) => {
  const { campaignSlug } = req.params;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { slug: campaignSlug },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        donations: {
          select: {
            donor: true,
            amount: true,
            notes: true,
          },
        },
      },
      omit: {
        updatedAt: true,
      },
    });

    return sendSuccess(res, "Success get campaign", campaign);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Campaign not found", 404);
    }

    return sendError(res);
  }
};

export const deleteCampaign = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) },
    });

    await prisma.campaign.delete({
      where: { id: campaign.id },
    });

    return sendSuccess(res, `${campaign.title} campaign has been deleted`);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Campaign not found", 404);
    }

    return sendError(res);
  }
};

export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        category: true,
      },
      omit: { updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "success get campaigns",
      data: campaigns,
    });
  } catch (error) {
    console.log(error);
    return sendError(res);
  }
};

export const getCampaignStats = async (req, res) => {
  try {
    const stats = await prisma.campaign.aggregate({
      _count: { _all: true },
      _sum: { currentAmount: true, totalDonors: true },
    });

    return sendSuccess(res, "Success get campaign stats", stats);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const searchCampaign = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const category = req.query.category || "";
    const offset = (page - 1) * limit;

    const queryFilter = {
      where: {
        category: {
          slug: {
            contains: category,
            mode: "insensitive",
          },
        },
        status: "active",
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    };

    const [campaigns, totalItems] = await Promise.all([
      prisma.campaign.findMany({
        ...queryFilter,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.campaign.count({ where: queryFilter.where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      message: "Success get campaign pagination",
      data: campaigns,
      meta: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const getCampaignsByFundraiser = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        category: true,
      },
      omit: { updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "success get campaigns by fundraiser",
      data: campaigns,
    });
  } catch (error) {
    console.log(error);
    return sendError(res);
  }
};
