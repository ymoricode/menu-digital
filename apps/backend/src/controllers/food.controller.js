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

    // Handle file upload - use buffer from memoryStorage for Vercel
    if (req.file && req.file.buffer) {
      if (cloudinaryService.isCloudinaryConfigured()) {
        // Upload buffer to Cloudinary
        try {
          const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, 'menu-digital/foods');
          if (uploadResult && uploadResult.url) {
            image = uploadResult.url;
          }
        } catch (uploadError) {
          console.error('Cloudinary upload failed:', uploadError.message);
          // Continue without image if upload fails
        }
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

    // Handle file upload - use buffer from memoryStorage for Vercel
    if (req.file && req.file.buffer) {
      if (cloudinaryService.isCloudinaryConfigured()) {
        // Upload buffer to Cloudinary
        try {
          const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, 'menu-digital/foods');
          if (uploadResult && uploadResult.url) {
            image = uploadResult.url;
          }
        } catch (uploadError) {
          console.error('Cloudinary upload failed:', uploadError.message);
          // Continue with existing image if upload fails
        }
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
