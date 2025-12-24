import { db } from '../db/index.js';
import { transactions, transactionItems, foods, barcodes } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import xenditService from './xendit.service.js';

/**
 * Get all transactions
 */
export const getAll = async () => {
  try {
    const result = await db
      .select({
        id: transactions.id,
        code: transactions.code,
        name: transactions.name,
        phone: transactions.phone,
        externalId: transactions.externalId,
        checkoutLink: transactions.checkoutLink,
        barcodeId: transactions.barcodeId,
        tableNumber: barcodes.tableNumber,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        total: transactions.total,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .leftJoin(barcodes, eq(transactions.barcodeId, barcodes.id))
      .orderBy(desc(transactions.createdAt));

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get transaction by ID with items
 */
export const getById = async (id) => {
  try {
    const [transaction] = await db
      .select({
        id: transactions.id,
        code: transactions.code,
        name: transactions.name,
        phone: transactions.phone,
        externalId: transactions.externalId,
        checkoutLink: transactions.checkoutLink,
        barcodeId: transactions.barcodeId,
        tableNumber: barcodes.tableNumber,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        total: transactions.total,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .leftJoin(barcodes, eq(transactions.barcodeId, barcodes.id))
      .where(eq(transactions.id, id))
      .limit(1);

    if (!transaction) return null;

    // Get transaction items
    const items = await db
      .select({
        id: transactionItems.id,
        foodsId: transactionItems.foodsId,
        foodName: foods.name,
        foodImage: foods.image,
        quantity: transactionItems.quantity,
        price: transactionItems.price,
        subtotal: transactionItems.subtotal,
      })
      .from(transactionItems)
      .leftJoin(foods, eq(transactionItems.foodsId, foods.id))
      .where(eq(transactionItems.transactionId, id));

    return {
      ...transaction,
      items,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get transaction by external ID (from Xendit)
 */
export const getByExternalId = async (externalId) => {
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.externalId, externalId))
      .limit(1);

    return transaction;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new transaction with items and Xendit invoice
 */
export const create = async (data) => {
  try {
    const transactionCode = `ORD-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    
    // Calculate total
    let total = 0;
    const itemsWithSubtotal = data.items.map((item) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      return {
        ...item,
        subtotal,
      };
    });

    // Create Xendit invoice
    const xenditResult = await xenditService.createInvoice({
      code: transactionCode,
      name: data.name,
      phone: data.phone,
      email: data.email,
      total,
      items: itemsWithSubtotal.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    // Create transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        code: transactionCode,
        name: data.name,
        phone: data.phone,
        externalId: xenditResult.externalId,
        checkoutLink: xenditResult.invoiceUrl,
        barcodeId: data.barcodeId || null,
        paymentMethod: 'xendit',
        paymentStatus: 'pending',
        total,
      })
      .returning();

    // Create transaction items
    for (const item of itemsWithSubtotal) {
      await db.insert(transactionItems).values({
        transactionId: newTransaction.id,
        foodsId: item.foodsId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      });
    }

    return {
      ...newTransaction,
      checkoutLink: xenditResult.invoiceUrl,
      items: itemsWithSubtotal,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update transaction payment status
 */
export const updatePaymentStatus = async (externalId, status, paymentMethod = null) => {
  try {
    const updateData = {
      paymentStatus: status,
      updatedAt: new Date(),
    };

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    const [updatedTransaction] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.externalId, externalId))
      .returning();

    return updatedTransaction;
  } catch (error) {
    throw error;
  }
};

export default {
  getAll,
  getById,
  getByExternalId,
  create,
  updatePaymentStatus,
};
