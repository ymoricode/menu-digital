import recommendationService from '../services/recommendation.service.js';

/**
 * Controller untuk Rekomendasi Menu & Association Rule Mining
 */

/**
 * Mengambil rekomendasi menu "Sering Dipesan Bersama" untuk suatu produk
 * GET /api/recommendations/:foodId
 */
export const getRecommendations = async (req, res) => {
  try {
    const { foodId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 4;

    const data = await recommendationService.getRecommendations(foodId, limit);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in getRecommendations controller:', error);
    // Kembalikan data kosong secara aman agar tidak memutus akses halaman detail menu pelanggan
    return res.status(200).json({
      success: true,
      data: [],
      error: error.message,
    });
  }
};

/**
 * Mengambil daftar seluruh Association Rules hasil analisis Apriori
 * GET /api/recommendations/rules
 */
export const getRules = async (req, res) => {
  try {
    const rules = await recommendationService.getAllRules();

    return res.json({
      success: true,
      total: rules.length,
      data: rules,
    });
  } catch (error) {
    console.error('Error in getRules controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengambil aturan asosiasi Apriori',
    });
  }
};

/**
 * Menjalankan analisis Association Rule Mining (Apriori) pada data transaksi aktual
 * POST /api/recommendations/analyze
 */
export const runAnalysis = async (req, res) => {
  try {
    const { minSupport, minConfidence, minLift } = req.body || {};

    const options = {};
    if (minSupport !== undefined) options.minSupport = parseFloat(minSupport);
    if (minConfidence !== undefined) options.minConfidence = parseFloat(minConfidence);
    if (minLift !== undefined) options.minLift = parseFloat(minLift);

    const result = await recommendationService.runAnalysis(options);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error running Apriori analysis:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menjalankan analisis Apriori',
    });
  }
};

export default {
  getRecommendations,
  getRules,
  runAnalysis,
};

