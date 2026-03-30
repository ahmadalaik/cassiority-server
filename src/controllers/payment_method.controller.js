import prisma from "../utils/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { paymentMethodSchema } from "../utils/schema.js";

export const createPaymentMethod = async (req, res) => {
  try {
    const parse = paymentMethodSchema.safeParse(req.body);
    if (!parse.success) {
      const errorMessage = parse.error.issues.map((err) => `${err.path} - ${err.message}`);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: null,
      });
    }

    const { provider, accountNumber, ...rest } = parse.data;
    const count = await prisma.paymentMethod.count({
      where: { provider, accountNumber },
    });

    if (count > 0) {
      return sendError(res, "Payment method already exists", 409);
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: { provider, accountNumber, ...rest },
    });

    return sendSuccess(res, "Payment method created successfully", paymentMethod, 201);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const updatePaymentMethod = async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    const parse = paymentMethodSchema.safeParse(req.body);
    if (!parse.success) {
      console.log(parse.error);
      return res.status(400).json({
        success: false,
        message: parse.error.issues.map((err) => `${err.path} - ${err.message}`),
        data: null,
      });
    }

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id: parseInt(paymentMethodId) },
    });

    const { type, ...rest } = parse.data;
    const updated = await prisma.paymentMethod.update({
      where: { id: paymentMethod.id },
      data: {
        type,
        ...rest,
      },
    });

    return sendSuccess(res, "Payment method updated successfully", updated);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Payment method not found", 404);
    }

    return sendError(res);
  }
};

export const getPaymentMethod = async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id: parseInt(paymentMethodId) },
      omit: { updatedAt: true },
    });

    return sendSuccess(res, "Success get payment method", paymentMethod);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Payment method not found", 404);
    }

    return sendError(res);
  }
};

export const deletePaymentMethod = async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id: parseInt(paymentMethodId) },
    });

    await prisma.paymentMethod.delete({
      where: { id: paymentMethod.id },
    });

    return sendSuccess(res, `${paymentMethod.provider} payment method has been deleted`);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Payment method not found", 404);
    }

    return sendError(res);
  }
};

export const getAllPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { createdAt: "asc" },
    });

    return sendSuccess(res, "Success get payment methods", paymentMethods);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const searchPaymentMethod = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    const queryFilter = {
      where: {
        provider: {
          contains: search,
          mode: "insensitive",
        },
      },
    };

    const [paymentMethods, totalItems] = await Promise.all([
      prisma.paymentMethod.findMany({
        ...queryFilter,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentMethod.count({ where: queryFilter.where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      message: "Success get payment method pagination",
      data: paymentMethods,
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
