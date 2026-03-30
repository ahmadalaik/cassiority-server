import prisma from "../utils/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const listFundraiser = async (req, res) => {
  try {
    const roleUpgradeRequests = await prisma.roleUpgradeRequests.findMany({
      where: {
        requestedRole: "fundraiser",
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      omit: { updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    return sendSuccess(res, "Success get list request fundraiser", roleUpgradeRequests);
  } catch (error) {
    console.log("error: ", error);
    return sendError(res);
  }
};
