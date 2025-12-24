import foodService from '../services/food.service.js';
import cloudinaryService from '../services/cloudinary.service.js';

/**
 * Get all foods
 */
export const getAll = async (req, res) => {
  try {
    const foods = await foodService.getAll();

    res.json({
      success: true,
      data: foods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get foods',
    });
  }
};

/**
 * Get food by ID
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await foodService.getById(parseInt(id));

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    res.json({
      success: true,
      data: food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get food',
    });
  }
};

/**
 * Create new food
 */
export const create = async (req, res) => {
  try {
    const { name, description, price, categoriesId } = req.body;
    let image = req.body.image;

    // Handle file upload - try Cloudinary first, fallback to local
    if (req.file) {
      if (cloudinaryService.isCloudinaryConfigured()) {
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadFromPath(req.file.path, 'menu-digital/foods');
        if (uploadResult) {
          image = uploadResult.url;
        }
      } else {
        // Fallback to local storage
        image = `/uploads/${req.file.filename}`;
      }
    }

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
    }

    const food = await foodService.create({
      name,
      description,
      image,
      price,
      categoriesId,
    });

    res.status(201).json({
      success: true,
      message: 'Food created successfully',
      data: food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create food',
    });
  }
};

/**
 * Update food
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoriesId } = req.body;
    let image = req.body.image;

    // Handle file upload - try Cloudinary first, fallback to local
    if (req.file) {
      if (cloudinaryService.isCloudinaryConfigured()) {
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadFromPath(req.file.path, 'menu-digital/foods');
        if (uploadResult) {
          image = uploadResult.url;
        }
      } else {
        // Fallback to local storage
        image = `/uploads/${req.file.filename}`;
      }
    }

    const food = await foodService.update(parseInt(id), {
      name,
      description,
      image,
      price,
      categoriesId,
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    res.json({
      success: true,
      message: 'Food updated successfully',
      data: food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update food',
    });
  }
};

/**
 * Delete food
 */
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await foodService.remove(parseInt(id));

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      });
    }

    res.json({
      success: true,
      message: 'Food deleted successfully',
      data: food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete food',
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
