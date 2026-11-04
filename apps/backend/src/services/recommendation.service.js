import { db, pool } from '../db/index.js';
import { aprioriRules, foods, categories } from '../db/schema.js';
import { eq, and, gt, ne, desc } from 'drizzle-orm';
import aprioriService from './apriori.service.js';

/**
 * Service Rekomendasi Menu Berdasarkan Hasil Association Rule Mining (Apriori)
 */

let tableEnsured = false;

/**
 * Memastikan tabel apriori_rules sudah ada di database
 */
export const ensureTable = async () => {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS apriori_rules (
        id SERIAL PRIMARY KEY,
        antecedent_food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
        consequent_food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
        support DOUBLE PRECISION NOT NULL,
        confidence DOUBLE PRECISION NOT NULL,
        lift DOUBLE PRECISION NOT NULL,
        transaction_count INTEGER DEFAULT 0,
        total_transactions INTEGER DEFAULT 0,
        computed_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_apriori_rules_antecedent ON apriori_rules(antecedent_food_id);
    `);
    tableEnsured = true;
  } catch (err) {
    console.error('Error ensuring apriori_rules table exists:', err.message);
  }
};

/**
 * Mengambil rekomendasi menu "Sering Dipesan Bersama" untuk suatu produk (antecedent)
 * @param {number} foodId - ID produk yang sedang dilihat pelanggan
 * @param {number} limit - Jumlah maksimal rekomendasi (default: 4)
 */
export const getRecommendations = async (foodId, limit = 4) => {
  try {
    const targetFoodId = parseInt(foodId, 10);
    if (isNaN(targetFoodId)) {
      return [];
    }

    // Pastikan tabel apriori_rules sudah dibuat
    await ensureTable();

    // Jika tabel aturan masih kosong, jalankan analisis Apriori secara otomatis
    try {
      const countRes = await pool.query('SELECT COUNT(*) FROM apriori_rules');
      const ruleCount = parseInt(countRes.rows[0]?.count || 0, 10);
      if (ruleCount === 0) {
        await aprioriService.mineAssociationRules();
      }
    } catch (countErr) {
      console.warn('Auto-mining check warning:', countErr.message);
    }

    // Ambil rules dari tabel apriori_rules di mana produk saat ini adalah antecedent
    // dan memiliki nilai lift > 1.0 (korelasi positif)
    const rules = await db
      .select({
        ruleId: aprioriRules.id,
        support: aprioriRules.support,
        confidence: aprioriRules.confidence,
        lift: aprioriRules.lift,
        foodId: foods.id,
        name: foods.name,
        description: foods.description,
        image: foods.image,
        price: foods.price,
        categoriesId: foods.categoriesId,
        categoryName: categories.name,
      })
      .from(aprioriRules)
      .innerJoin(foods, eq(aprioriRules.consequentFoodId, foods.id))
      .leftJoin(categories, eq(foods.categoriesId, categories.id))
      .where(
        and(
          eq(aprioriRules.antecedentFoodId, targetFoodId),
          ne(aprioriRules.consequentFoodId, targetFoodId), // Pastikan bukan produk yang sama
          gt(aprioriRules.lift, 1.0)                      // Hanya aturan dengan korelasi positif
        )
      )
      .orderBy(
        desc(aprioriRules.lift),
        desc(aprioriRules.confidence),
        desc(aprioriRules.support)
      );

    if (!rules || rules.length === 0) {
      return [];
    }

    // Hilangkan duplikasi consequent jika ada multiple rules yang mengarah ke produk sama
    const seen = new Set();
    const uniqueRecommendations = [];

    for (const item of rules) {
      if (!seen.has(item.foodId)) {
        seen.add(item.foodId);
        uniqueRecommendations.push({
          id: item.foodId,
          name: item.name,
          description: item.description,
          image: item.image,
          price: item.price,
          categoriesId: item.categoriesId,
          categoryName: item.categoryName,
          // Metrik Apriori (dapat digunakan untuk debugging / transparansi)
          support: item.support,
          confidence: item.confidence,
          lift: item.lift,
        });

        if (uniqueRecommendations.length >= limit) {
          break;
        }
      }
    }

    return uniqueRecommendations;
  } catch (error) {
    console.error(`Error getting recommendations for foodId ${foodId}:`, error);
    // Kembalikan array kosong jika terjadi kegagalan agar halaman detail produk tetap dapat dibuka
    return [];
  }
};

/**
 * Mengambil semua association rules yang tersimpan di sistem
 */
export const getAllRules = async () => {
  try {
    await ensureTable();

    const rules = await db
      .select({
        id: aprioriRules.id,
        antecedentFoodId: aprioriRules.antecedentFoodId,
        consequentFoodId: aprioriRules.consequentFoodId,
        support: aprioriRules.support,
        confidence: aprioriRules.confidence,
        lift: aprioriRules.lift,
        transactionCount: aprioriRules.transactionCount,
        totalTransactions: aprioriRules.totalTransactions,
        computedAt: aprioriRules.computedAt,
      })
      .from(aprioriRules)
      .orderBy(desc(aprioriRules.lift), desc(aprioriRules.confidence));

    // Ambil info nama produk untuk keterbacaan
    const allFoods = await db
      .select({ id: foods.id, name: foods.name })
      .from(foods);
    
    const foodMap = new Map(allFoods.map((f) => [f.id, f.name]));

    const enrichedRules = rules.map((r) => ({
      ...r,
      antecedentFoodName: foodMap.get(r.antecedentFoodId) || `Food #${r.antecedentFoodId}`,
      consequentFoodName: foodMap.get(r.consequentFoodId) || `Food #${r.consequentFoodId}`,
    }));

    return enrichedRules;
  } catch (error) {
    console.error('Error getting all apriori rules:', error);
    throw error;
  }
};

/**
 * Menjalankan proses analisis Apriori dan memperbarui database rules
 */
export const runAnalysis = async (options) => {
  await ensureTable();
  return await aprioriService.mineAssociationRules(options);
};

export default {
  ensureTable,
  getRecommendations,
  getAllRules,
  runAnalysis,
};
