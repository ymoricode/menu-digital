import categoryService from "../services/category.service.js";

/**
 * categories controller
 */
export const getAll = async (req, res) => {
  try {
    const categories = await categoryService.getAll();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get categories",
    });
  }
};

/**
 * mengambil category berdasarkan id
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getById(parseInt(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get category",
    });
  }
};

/**
 * tambah category
 */
export const create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await categoryService.create({ name });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

/**
 * edit category
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await categoryService.update(parseInt(id), { name });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

/**
 * Delete category
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.remove(parseInt(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete category",
    });
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
