import { db, pool } from '../db/index.js';
import { transactions, transactionItems, aprioriRules, foods } from '../db/schema.js';
import { eq, inArray, desc, sql } from 'drizzle-orm';

/**
 * Service Algoritma Apriori (Association Rule Mining)
 * 
 * Implementasi Association Rule Mining menggunakan Algoritma Apriori
 * berdasarkan data transaksi penjualan aktual pada Warung Bakso Putra Solo.
 * 
 * Tahapan:
 * 1. Ekstraksi transaksi (keranjang belanja) dari transaksi dengan status 'paid'/'completed'
 * 2. Hitung frekuensi 1-itemset (L1) yang memenuhi minSupport
 * 3. Bentuk kandidat 2-itemset (C2) dan hitung 2-itemset yang memenuhi minSupport (L2)
 * 4. Hasilkan Association Rules: Antecedent -> Consequent
 *    - Support(A -> B) = P(A ∩ B) = freq(A, B) / N
 *    - Confidence(A -> B) = P(B | A) = freq(A, B) / freq(A)
 *    - Lift(A -> B) = Confidence(A -> B) / Support(B) = P(A ∩ B) / (P(A) * P(B))
 * 5. Simpan aturan yang memenuhi minConfidence dan lift > 1.0 ke tabel apriori_rules
 */

/**
 * Mengambil dataset transaksi dari database
 * Dikelompokkan per transaction_id menjadi array of food_ids
 */
export const getTransactionBaskets = async () => {
  try {
    // Ambil transaksi yang sudah berhasil (paid atau completed)
    const validTransactions = await db
      .select({
        transactionId: transactions.id,
        foodId: transactionItems.foodsId,
      })
      .from(transactions)
      .innerJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
      .where(inArray(transactions.paymentStatus, ['paid', 'completed']));

    if (!validTransactions || validTransactions.length === 0) {
      return { baskets: [], totalTransactions: 0 };
    }

    // Kelompokkan per transaksi (Set unik foodId per transaksi)
    const basketMap = new Map();
    for (const row of validTransactions) {
      if (!row.foodId) continue;
      if (!basketMap.has(row.transactionId)) {
        basketMap.set(row.transactionId, new Set());
      }
      basketMap.get(row.transactionId).add(row.foodId);
    }

    const baskets = Array.from(basketMap.values()).map((set) => Array.from(set));
    return {
      baskets,
      totalTransactions: baskets.length,
    };
  } catch (error) {
    console.error('Error fetching transaction baskets:', error);
    throw error;
  }
};

/**
 * Menjalankan Algoritma Apriori pada transaksi aktual
 * @param {Object} options
 * @param {number} options.minSupport - Nilai minimum support (default: 0.05 / 5%)
 * @param {number} options.minConfidence - Nilai minimum confidence (default: 0.20 / 20%)
 * @param {number} options.minLift - Nilai minimum lift (default: 1.0 - korelasi positif)
 */
export const mineAssociationRules = async ({
  minSupport = 0.05,
  minConfidence = 0.20,
  minLift = 1.0,
} = {}) => {
  const { baskets, totalTransactions } = await getTransactionBaskets();

  if (totalTransactions === 0) {
    return {
      success: true,
      message: 'Belum ada data transaksi yang berstatus paid/completed untuk dianalisis.',
      totalTransactions: 0,
      rulesGenerated: 0,
      rules: [],
    };
  }

  // Filter hanya transaksi dengan minimal 2 item untuk analisis pasangan menu
  const multiItemBaskets = baskets.filter((b) => b.length >= 2);

  // ── Langkah 1: Hitung frekuensi tiap item (1-itemset) ──
  const itemCounts = new Map();
  for (const basket of baskets) {
    for (const itemId of basket) {
      itemCounts.set(itemId, (itemCounts.get(itemId) || 0) + 1);
    }
  }

  // Hitung support 1-itemset
  const itemSupport = new Map();
  for (const [itemId, count] of itemCounts.entries()) {
    const supp = count / totalTransactions;
    if (supp >= minSupport) {
      itemSupport.set(itemId, supp);
    }
  }

  const frequent1Itemsets = Array.from(itemSupport.keys());

  // ── Langkah 2: Hitung frekuensi 2-itemset (C2 -> L2) ──
  const pairCounts = new Map();
  for (const basket of multiItemBaskets) {
    // Saring hanya item yang ada di frequent 1-itemsets
    const filteredBasket = basket.filter((id) => itemSupport.has(id));
    const n = filteredBasket.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const itemA = Math.min(filteredBasket[i], filteredBasket[j]);
        const itemB = Math.max(filteredBasket[i], filteredBasket[j]);
        const key = `${itemA}_${itemB}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  // ── Langkah 3: Pembentukan Association Rules ──
  const rules = [];

  for (const [key, count] of pairCounts.entries()) {
    const [itemAStr, itemBStr] = key.split('_');
    const itemA = parseInt(itemAStr, 10);
    const itemB = parseInt(itemBStr, 10);

    const pairSupport = count / totalTransactions;
    if (pairSupport < minSupport) continue;

    const countA = itemCounts.get(itemA) || 0;
    const countB = itemCounts.get(itemB) || 0;

    const suppA = countA / totalTransactions;
    const suppB = countB / totalTransactions;

    // Rule 1: A -> B
    if (suppA > 0) {
      const confidenceAtoB = pairSupport / suppA;
      const liftAtoB = suppB > 0 ? confidenceAtoB / suppB : 0;

      if (confidenceAtoB >= minConfidence && liftAtoB >= minLift) {
        rules.push({
          antecedentFoodId: itemA,
          consequentFoodId: itemB,
          support: parseFloat(pairSupport.toFixed(4)),
          confidence: parseFloat(confidenceAtoB.toFixed(4)),
          lift: parseFloat(liftAtoB.toFixed(4)),
          transactionCount: count,
          totalTransactions,
        });
      }
    }

    // Rule 2: B -> A
    if (suppB > 0) {
      const confidenceBtoA = pairSupport / suppB;
      const liftBtoA = suppA > 0 ? confidenceBtoA / suppA : 0;

      if (confidenceBtoA >= minConfidence && liftBtoA >= minLift) {
        rules.push({
          antecedentFoodId: itemB,
          consequentFoodId: itemA,
          support: parseFloat(pairSupport.toFixed(4)),
          confidence: parseFloat(confidenceBtoA.toFixed(4)),
          lift: parseFloat(liftBtoA.toFixed(4)),
          transactionCount: count,
          totalTransactions,
        });
      }
    }
  }

  // ── Langkah 4: Simpan ke tabel apriori_rules secara atomic ──
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kosongkan aturan lama dan ganti dengan hasil analisis terbaru
    await client.query('DELETE FROM apriori_rules');

    if (rules.length > 0) {
      for (const rule of rules) {
        await client.query(
          `INSERT INTO apriori_rules 
           (antecedent_food_id, consequent_food_id, support, confidence, lift, transaction_count, total_transactions, computed_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())`,
          [
            rule.antecedentFoodId,
            rule.consequentFoodId,
            rule.support,
            rule.confidence,
            rule.lift,
            rule.transactionCount,
            rule.totalTransactions,
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (dbError) {
    await client.query('ROLLBACK');
    console.error('Error saving apriori rules to DB:', dbError);
    throw dbError;
  } finally {
    client.release();
  }

  return {
    success: true,
    message: `Analisis Apriori berhasil dijalankan. Ditemukan ${rules.length} association rules dari ${totalTransactions} transaksi.`,
    totalTransactions,
    multiItemTransactions: multiItemBaskets.length,
    rulesGenerated: rules.length,
    parameters: {
      minSupport,
      minConfidence,
      minLift,
    },
    rules,
  };
};

export default {
  getTransactionBaskets,
  mineAssociationRules,
};

