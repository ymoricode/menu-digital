import { db } from '../db/index.js';
import { barcodes, users } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { generateQRCode, generateQRCodeBase64 } from '../utils/qrcode.js';
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
 */
export const create = async (data, userId = null) => {
  try {
    // Generate QR value (URL to menu with table number)
    const qrValue = `${process.env.FRONTEND_URL}/menu?table=${data.tableNumber}`;
    const filename = `qr-table-${data.tableNumber}-${Date.now()}`;
    
    // Generate QR code image
    const qrResult = await generateQRCode(qrValue, filename);

    const [newBarcode] = await db
      .insert(barcodes)
      .values({
        tableNumber: data.tableNumber,
        image: qrResult.filePath,
        qrValue: qrValue,
        userId: userId,
      })
      .returning();

    return {
      ...newBarcode,
      qrBase64: await generateQRCodeBase64(qrValue),
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
 */
export const regenerateQR = async (id) => {
  try {
    const barcode = await getById(id);
    if (!barcode) {
      throw new Error('Barcode not found');
    }

    const filename = `qr-table-${barcode.tableNumber}-${Date.now()}`;
    const qrResult = await generateQRCode(barcode.qrValue, filename);

    const [updatedBarcode] = await db
      .update(barcodes)
      .set({
        image: qrResult.filePath,
        updatedAt: new Date(),
      })
      .where(eq(barcodes.id, id))
      .returning();

    return {
      ...updatedBarcode,
      qrBase64: await generateQRCodeBase64(barcode.qrValue),
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
