import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

/**
 * Login user with email and password
 */
export const login = async (email, password) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Register new user (admin only for now)
 */
export const register = async (userData) => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
      })
      .returning();

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    };
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  } catch (error) {
    throw error;
  }
};

export default {
  login,
  register,
  getUserById,
};
