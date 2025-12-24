import menuService from '../services/menu.service.js';

/**
 * Get all menus (customer facing)
 */
export const getAll = async (req, res) => {
  try {
    const { search, category } = req.query;
    const menus = await menuService.getAllMenus(search, category);

    res.json({
      success: true,
      data: menus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get menus',
    });
  }
};

/**
 * Get menu by ID
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await menuService.getMenuById(parseInt(id));

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found',
      });
    }

    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get menu',
    });
  }
};

/**
 * Get all categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await menuService.getAllCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories',
    });
  }
};

export default {
  getAll,
  getById,
  getCategories,
};
