import { db } from '../db/index.js';
import { foods, categories } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * Get all foods with category info
 */
export const getAll = async () => {
  try {
    const result = await db
      .select({
        id: foods.id,
        name: foods.name,
        description: foods.description,
        image: foods.image,
        price: foods.price,
        categoriesId: foods.categoriesId,
        categoryName: categories.name,
        createdAt: foods.createdAt,
        updatedAt: foods.updatedAt,
      })
      .from(foods)
      .leftJoin(categories, eq(foods.categoriesId, categories.id))
      .orderBy(desc(foods.createdAt));

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get food by ID
 */
export const getById = async (id) => {
  try {
    const [food] = await db
      .select({
        id: foods.id,
        name: foods.name,
        description: foods.description,
        image: foods.image,
        price: foods.price,
        categoriesId: foods.categoriesId,
        categoryName: categories.name,
        createdAt: foods.createdAt,
        updatedAt: foods.updatedAt,
      })
      .from(foods)
      .leftJoin(categories, eq(foods.categoriesId, categories.id))
      .where(eq(foods.id, id))
      .limit(1);

    return food;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new food
 */
export const create = async (data) => {
  try {
    const [newFood] = await db
      .insert(foods)
      .values({
        name: data.name,
        description: data.description,
        image: data.image,
        price: parseInt(data.price),
        categoriesId: data.categoriesId ? parseInt(data.categoriesId) : null,
      })
      .returning();

    return newFood;
  } catch (error) {
    throw error;
  }
};

/**
 * Update food
 */
export const update = async (id, data) => {
  try {
    const updateData = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.price !== undefined) updateData.price = parseInt(data.price);
    if (data.categoriesId !== undefined) {
      updateData.categoriesId = data.categoriesId ? parseInt(data.categoriesId) : null;
    }

    const [updatedFood] = await db
      .update(foods)
      .set(updateData)
      .where(eq(foods.id, id))
      .returning();

    return updatedFood;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete food
 */
export const remove = async (id) => {
  try {
    const [deletedFood] = await db
      .delete(foods)
      .where(eq(foods.id, id))
      .returning();

    return deletedFood;
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
