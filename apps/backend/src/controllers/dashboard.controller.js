import dashboardService from "../services/dashboard.service.js";

/**
 * Dashboard controller
 */
export const getSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get summary",
    });
  }
};

/**
 * mengambil data produk terlaris
 */
export const getTopProducts = async (req, res) => {
  try {
    const { limit } = req.query;
    const products = await dashboardService.getTopProducts(
      limit ? parseInt(limit) : 5
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get top products",
    });
  }
};

/**
 * mengambil data pemasukan bulanan
 */
export const getMonthlyIncome = async (req, res) => {
  try {
    const { year } = req.query;
    const income = await dashboardService.getMonthlyIncome(
      year ? parseInt(year) : new Date().getFullYear()
    );

    res.json({
      success: true,
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get monthly income",
    });
  }
};

/**
 * mengambil data pemasukan mingguan
 */
export const getWeeklyIncome = async (req, res) => {
  try {
    const income = await dashboardService.getWeeklyIncome();

    res.json({
      success: true,
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get weekly income",
    });
  }
};

/**
 * mengambil data transaksi terbaru
 */
export const getRecentTransactions = async (req, res) => {
  try {
    const { limit } = req.query;
    const transactions = await dashboardService.getRecentTransactions(
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get recent transactions",
    });
  }
};

export default {
  getSummary,
  getTopProducts,
  getMonthlyIncome,
  getWeeklyIncome,
  getRecentTransactions,
};
