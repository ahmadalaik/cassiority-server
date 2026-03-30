import prisma from "../utils/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const adminDashboardStats = async (req, res) => {
  try {
    const [categories, campaigns, raised, donors] = await prisma.$transaction([
      prisma.category.count(),
      prisma.campaign.count(),
      prisma.campaign.aggregate({
        _sum: { currentAmount: true },
      }),
      prisma.donation.count(),
    ]);

    const [dailyStats, categoryChart] = await prisma.$transaction([
      prisma.$queryRaw`
            SELECT
                DATE("createdAt") as date,
                SUM(COALESCE(amount, 0)) as "totalAmount",
                COUNT(id) as "totalDonors"
            FROM "donations"
            WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `,

      prisma.$queryRaw`
        WITH categoryTotals AS (
            SELECT
                c.name as "categoryName",
                SUM(d.amount) as "totalAmount"
            FROM "categories" c
            LEFT JOIN "campaigns" cp ON c.id = cp."categoryId"
            LEFT JOIN "donations" d ON cp.id = d."campaignId"
            WHERE d."createdAt" >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY c.name
        )
        SELECT
            "categoryName",
            "totalAmount",
            CASE
                WHEN SUM("totalAmount") OVER() > 0
                THEN ROUND(("totalAmount" / SUM("totalAmount") OVER()) * 100, 2)
                ELSE 0
            END as percentage
        FROM categoryTotals
        ORDER BY percentage DESC
        `,
    ]);

    const data = {
      totalCategories: categories,
      totalCampaigns: campaigns,
      totalDonors: donors,
      totalRaised: raised._sum.currentAmount || BigInt(0),
      dailyStats,
      categoryChart,
    };

    return sendSuccess(res, "Success get dashboard statistics", data);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const fundraiserDashboardStats = async (req, res) => {
  try {
    const [campaign, donations, campaigns, raised, donors] = await prisma.$transaction([
      prisma.campaign.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        omit: { categoryId: true, updatedAt: true },
      }),
      prisma.donation.findMany({
        where: { campaign: { userId: req.user.id }, status: "success" },
        take: 5,
        select: { id: true, donor: true, amount: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.campaign.count({
        where: { userId: req.user.id },
      }),
      prisma.campaign.aggregate({
        where: { userId: req.user.id },
        _sum: { currentAmount: true },
      }),
      prisma.donation.count({
        where: { campaign: { userId: req.user.id }, status: "success" },
      }),
    ]);

    const data = {
      recentCampaign: campaign,
      recentDonations: donations,
      totalCampaigns: campaigns,
      totalDonors: donors,
      totalRaised: raised._sum.currentAmount || BigInt(0),
    };

    return sendSuccess(res, "Success get dashboard statistics", data);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const userDashboardStats = async (req, res) => {
  try {
    const [donations, spend] = await prisma.$transaction([
      prisma.donation.findMany({
        where: { userId: req.user.id },
        take: 5,
        select: { id: true, amount: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.donation.aggregate({
        where: { userId: req.user.id, status: "success" },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: { id: true },
      }),
    ]);

    const data = {
      recentDonations: donations,
      totalDonations: spend._count.id || 0,
      totalSpend: spend._sum.amount || BigInt(0),
      averageSpend: spend._avg.amount || 0,
    };

    return sendSuccess(res, "Success get dashboard statistics", data);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};
