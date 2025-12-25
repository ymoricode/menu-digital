import { db } from '../db/index.js';
import { barcodes, users } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { generateQRCodeBase64 } from '../utils/qrcode.js';
import * as cloudinaryService from './cloudinary.service.js';
import 'dotenv/config';

/**
 * Get all barcodes
 */
export const getAll = async () => {
  try {
    const result = await db
      .select({
        id: barcodes.id,
        tableNumber: barcodes.tableNumber,
        image: barcodes.image,
        qrValue: barcodes.qrValue,
        userId: barcodes.userId,
        userName: users.name,
        createdAt: barcodes.createdAt,
        updatedAt: barcodes.updatedAt,
      })
      .from(barcodes)
      .leftJoin(users, eq(barcodes.userId, users.id))
      .orderBy(desc(barcodes.createdAt));

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get barcode by table number
 */
export const getByTableNumber = async (tableNumber) => {
  try {
    const [barcode] = await db
      .select()
      .from(barcodes)
      .where(eq(barcodes.tableNumber, tableNumber))
      .limit(1);

    return barcode;
  } catch (error) {
    throw error;
  }
};

/**
 * Get barcode by ID
 */
export const getById = async (id) => {
  try {
    const [barcode] = await db
      .select()
      .from(barcodes)
      .where(eq(barcodes.id, id))
      .limit(1);

    return barcode;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new barcode with QR code generation
 * Uses Cloudinary for serverless compatibility
 */
export const create = async (data, userId = null) => {
  try {
    // Generate QR value (URL to menu with table number)
    const frontendUrl = process.env.FRONTEND_URL || 'https://bakso-putra-solo.vercel.app';
    const qrValue = `${frontendUrl}/menu?table=${data.tableNumber}`;
    
    // Generate QR code as base64
    const qrBase64 = await generateQRCodeBase64(qrValue);
    
    // Upload to Cloudinary if configured, otherwise use base64 directly
    let imageUrl = qrBase64; // Default to base64
    
    if (cloudinaryService.isCloudinaryConfigured()) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(qrBase64, 'menu-digital/qrcodes');
        if (uploadResult && uploadResult.url) {
          imageUrl = uploadResult.url;
        }
      } catch (uploadError) {
        console.error('Cloudinary upload failed, using base64:', uploadError.message);
        // Keep using base64 as fallback
      }
    }

    const [newBarcode] = await db
      .insert(barcodes)
      .values({
        tableNumber: data.tableNumber,
        image: imageUrl,
        qrValue: qrValue,
        userId: userId,
      })
      .returning();

    return {
      ...newBarcode,
      qrBase64: qrBase64,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete barcode
 */
export const remove = async (id) => {
  try {
    const [deletedBarcode] = await db
      .delete(barcodes)
      .where(eq(barcodes.id, id))
      .returning();

    return deletedBarcode;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate QR code for existing barcode
 * Uses Cloudinary for serverless compatibility
 */
export const regenerateQR = async (id) => {
  try {
    const barcode = await getById(id);
    if (!barcode) {
      throw new Error('Barcode not found');
    }

    // Generate QR code as base64
    const qrBase64 = await generateQRCodeBase64(barcode.qrValue);
    
    // Upload to Cloudinary if configured
    let imageUrl = qrBase64;
    
    if (cloudinaryService.isCloudinaryConfigured()) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(qrBase64, 'menu-digital/qrcodes');
        if (uploadResult && uploadResult.url) {
          imageUrl = uploadResult.url;
        }
      } catch (uploadError) {
        console.error('Cloudinary upload failed, using base64:', uploadError.message);
      }
    }

    const [updatedBarcode] = await db
      .update(barcodes)
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(barcodes.id, id))
      .returning();

    return {
      ...updatedBarcode,
      qrBase64: qrBase64,
    };
  } catch (error) {
    throw error;
  }
};

export default {
  getAll,
  getByTableNumber,
  getById,
  create,
  remove,
  regenerateQR,
};
