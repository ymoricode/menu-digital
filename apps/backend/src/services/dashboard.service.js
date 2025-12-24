import { db } from '../db/index.js';
import { transactions, transactionItems, foods } from '../db/schema.js';
import { eq, sql, gte, lte, and, desc } from 'drizzle-orm';

/**
 * Get dashboard summary
 */
export const getSummary = async () => {
  try {
    // Total transactions
    const [totalTransactions] = await db
      .select({ count: sql`count(*)::int` })
      .from(transactions);

    // Total revenue (paid only)
    const [totalRevenue] = await db
      .select({ sum: sql`COALESCE(sum(${transactions.total}), 0)::int` })
      .from(transactions)
      .where(eq(transactions.paymentStatus, 'paid'));

    // Total pending
    const [pendingTransactions] = await db
      .select({ count: sql`count(*)::int` })
      .from(transactions)
      .where(eq(transactions.paymentStatus, 'pending'));

    // Today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayTransactions] = await db
      .select({ 
        count: sql`count(*)::int`,
        total: sql`COALESCE(sum(${transactions.total}), 0)::int` 
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, today),
          eq(transactions.paymentStatus, 'paid')
        )
      );

    // Total products
    const [totalProducts] = await db
      .select({ count: sql`count(*)::int` })
      .from(foods);

    return {
      totalTransactions: totalTransactions.count,
      totalRevenue: totalRevenue.sum,
      pendingTransactions: pendingTransactions.count,
      todayTransactions: todayTransactions.count,
      todayRevenue: todayTransactions.total,
      totalProducts: totalProducts.count,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get top selling products
 */
export const getTopProducts = async (limit = 5) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        f.id,
        f.name,
        f.image,
        f.price,
        COALESCE(SUM(ti.quantity), 0)::int as "totalSold",
        COALESCE(SUM(ti.subtotal), 0)::int as "totalRevenue"
      FROM foods f
      LEFT JOIN transaction_items ti ON f.id = ti.foods_id
      GROUP BY f.id, f.name, f.image, f.price
      ORDER BY "totalSold" DESC
      LIMIT ${limit}
    `);

    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Get monthly income data
 */
export const getMonthlyIncome = async (year = new Date().getFullYear()) => {
  try {
    const result = await db
      .select({
        month: sql`EXTRACT(MONTH FROM ${transactions.createdAt})::int`,
        total: sql`COALESCE(sum(${transactions.total}), 0)::int`,
        count: sql`count(*)::int`,
      })
      .from(transactions)
      .where(
        and(
          sql`EXTRACT(YEAR FROM ${transactions.createdAt}) = ${year}`,
          eq(transactions.paymentStatus, 'paid')
        )
      )
      .groupBy(sql`EXTRACT(MONTH FROM ${transactions.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${transactions.createdAt})`);

    // Fill in missing months with 0
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }));

    result.forEach((item) => {
      months[item.month - 1] = item;
    });

    return months;
  } catch (error) {
    throw error;
  }
};

/**
 * Get daily income for current week
 */
export const getWeeklyIncome = async () => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        day: sql`EXTRACT(DOW FROM ${transactions.createdAt})::int`,
        date: sql`DATE(${transactions.createdAt})`,
        total: sql`COALESCE(sum(${transactions.total}), 0)::int`,
        count: sql`count(*)::int`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startOfWeek),
          eq(transactions.paymentStatus, 'paid')
        )
      )
      .groupBy(sql`EXTRACT(DOW FROM ${transactions.createdAt})`, sql`DATE(${transactions.createdAt})`)
      .orderBy(sql`DATE(${transactions.createdAt})`);

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get recent transactions
 */
export const getRecentTransactions = async (limit = 10) => {
  try {
    const result = await db
      .select({
        id: transactions.id,
        code: transactions.code,
        name: transactions.name,
        total: transactions.total,
        paymentStatus: transactions.paymentStatus,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return result;
  } catch (error) {
    throw error;
  }
};

export default {
  getSummary,
  getTopProducts,
  getMonthlyIncome,
  getWeeklyIncome,
  getRecentTransactions,
};
