import prisma from "../utils/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { categorySchema } from "../utils/schema.js";
import { toSlugify } from "../utils/slug.js";

export const createCategory = async (req, res) => {
  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        message: parse.error.issues.map((err) => `${err.path} - ${err.message}`),
        data: null,
      });
    }

    const { name } = parse.data;
    const count = await prisma.category.count({
      where: { name },
    });

    if (count > 0) {
      return sendError(res, "Category already exists", 409);
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: toSlugify(name),
      },
    });

    return sendSuccess(res, "Category created successfully", category, 201);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};

export const updateCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      const errorMessage = parse.error.issues.map((err) => `${err.path} - ${err.message}`);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: null,
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
    });

    const { name } = parse.data;
    const updated = await prisma.category.update({
      where: { id: category.id },
      data: {
        name: name,
        slug: toSlugify(name),
      },
    });

    return sendSuccess(res, "Category updated successfully", updated);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Category not found", 404);
    }

    return sendError(res);
  }
};

export const getCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      return sendError(res, "Category not found", 404);
    }

    return sendSuccess(res, "Success get category", category);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Category not found", 404);
    }

    return sendError(res);
  }
};

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
    });

    await prisma.category.delete({
      where: { id: category.id },
    });

    return sendSuccess(res, `${category.name} category has been deleted`);
  } catch (error) {
    console.error("error: ", error);
    if (error.code === "P2025") {
      return sendError(res, "Category not found", 404);
    }

    return sendError(res);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      omit: { updatedAt: true },
      orderBy: { createdAt: "asc" },
    });

    return sendSuccess(res, "Success get categories", categories);
  } catch (error) {
    console.error("error: ", error);
    return sendError(res);
  }
};
