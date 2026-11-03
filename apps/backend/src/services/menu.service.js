import { db } from '../db/index.js';
import { foods, categories } from '../db/schema.js';
import { eq, ilike, desc } from 'drizzle-orm';

/**
 * Get all menus with category info
 */
export const getAllMenus = async (search = '', categoryId = null) => {
  try {
    let query = db
      .select({
        id: foods.id,
        name: foods.name,
        description: foods.description,
        image: foods.image,
        price: foods.price,
        categoriesId: foods.categoriesId,
        categoryName: categories.name,
        createdAt: foods.createdAt,
      })
      .from(foods)
      .leftJoin(categories, eq(foods.categoriesId, categories.id))
      .orderBy(desc(foods.createdAt));

    const result = await query;

    // Filter by search
    let filtered = result;
    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by category
    if (categoryId) {
      filtered = filtered.filter((item) => item.categoriesId === parseInt(categoryId));
    }

    return filtered;
  } catch (error) {
    throw error;
  }
};

/**
 * Get menu by ID
 */
export const getMenuById = async (id) => {
  try {
    const [menu] = await db
      .select({
        id: foods.id,
        name: foods.name,
        description: foods.description,
        image: foods.image,
        price: foods.price,
        categoriesId: foods.categoriesId,
        categoryName: categories.name,
        createdAt: foods.createdAt,
      })
      .from(foods)
      .leftJoin(categories, eq(foods.categoriesId, categories.id))
      .where(eq(foods.id, id))
      .limit(1);

    return menu;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all categories for filtering
 */
export const getAllCategories = async () => {
  try {
    const result = await db
      .select()
      .from(categories)
      .orderBy(categories.name);

    return result;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllMenus,
  getMenuById,
  getAllCategories,
};
