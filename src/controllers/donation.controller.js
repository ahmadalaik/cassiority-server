import cloudinary, { uploadToCloudinary } from "../utils/cloudinary.js";
import prisma from "../utils/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { donationSchema } from "../utils/schema.js";

export const createDonation = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const parse = donationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        message: parse.error.issues.map((err) => `${err.path} - ${err.message}`),
      });
    }

    if (!req.file) {
      return sendError(res, "Transfer proof is required", 400);
    }
    console.log("file: ", req.file);

    // const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    // const uploadRes = await cloudinary.uploader.upload(fileStr, {
    //   folder: "donations",
    // });

    const uploadRes = await uploadToCloudinary(req.file.buffer);

    const donation = await prisma.donation.create({
      data: {
        campaignId: parseInt(campaignId),
        userId: req.user.id,
        donor: parse.data.donor,
        amount: parse.data.amount,
        transferProof: uploadRes.secure_url,
        transferProofId: uploadRes.public_id,
        notes: parse.data.notes ? parse.data.notes : null,
      },
    });

    return sendSuccess(res, "Donation created successfully", donation, 201);
  } catch (error) {
    console.error("Donation error: ", error);
    if (error.public_id) {
      await cloudinary.uploader.destroy(error.public_id);
    }

    return sendError(res);
  }
};

export const updateDonation = async (req, res) => {
  const { donationId } = req.params;

  try {
    const { status } = req.body;

    await prisma.$transaction(async (tx) => {
      const updatedDonation = await tx.donation.update({
        where: { id: parseInt(donationId) },
        data: { status },
      });

      if (status === "success") {
        // update donors in campaign
        const updatedCampaign = await tx.campaign.update({
          where: { id: updatedDonation.campaignId },
          data: {
            totalDonors: { increment: 1 },
            currentAmount: { increment: updatedDonation.amount },
          },
        });

        if (
          updatedCampaign.currentAmount >= updatedCampaign.targetAmount &&
          updatedCampaign.status !== "completed"
        ) {
          await tx.campaign.update({
            where: { id: updatedCampaign.id },
            data: { status: "completed" },
          });
        }
      }
    });

    return sendSuccess(res, "Update donation successfully");
  } catch (error) {
    console.log("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Donation not found", 404);
    }

    return sendError(res);
  }
};

export const getAllDonationsByUser = async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { userId: req.user.id },
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
      },
      omit: { updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    return sendSuccess(res, "Success get user donations", donations);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const getDonationByUser = async (req, res) => {
  const { donationId } = req.params;

  try {
    const donation = await prisma.donation.findUnique({
      where: { id: parseInt(donationId), userId: req.user.id },
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
      },
      omit: {
        updatedAt: true,
      },
    });

    return sendSuccess(res, "Success get user donation", donation);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Donation not found", 404);
    }

    return sendError(res);
  }
};

export const getAllDonations = async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
      },
      omit: { updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    return sendSuccess(res, "Success get donations", donations);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const getDonationsCampaignByFundraiser = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const donations = await prisma.donation.findMany({
      where: { campaignId: parseInt(campaignId), userId: req.user.id },
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      omit: { updatedAt: true },
    });

    return sendSuccess(res, "Success get user donations", donations);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const getDonationsByFundraiser = async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { campaign: { userId: req.user.id } },
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      omit: { updatedAt: true },
    });

    return sendSuccess(res, "Success get donations by fundraiser", donations);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const getDonationStats = async (req, res) => {
  try {
    const totalDonors = await prisma.donation.aggregate({
      _sum: {},
    });
  } catch (error) {
    console.log(error);
    return sendError(res);
  }
};
