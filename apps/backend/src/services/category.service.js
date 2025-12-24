import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * Get all categories
 */
export const getAll = async () => {
  try {
    const result = await db
      .select()
      .from(categories)
      .orderBy(desc(categories.createdAt));

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get category by ID
 */
export const getById = async (id) => {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return category;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new category
 */
export const create = async (data) => {
  try {
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: data.name,
      })
      .returning();

    return newCategory;
  } catch (error) {
    throw error;
  }
};

/**
 * Update category
 */
export const update = async (id, data) => {
  try {
    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return updatedCategory;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete category
 */
export const remove = async (id) => {
  try {
    const [deletedCategory] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return deletedCategory;
  } catch (error) {
    throw error;
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
