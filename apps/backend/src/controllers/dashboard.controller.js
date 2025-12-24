import dashboardService from '../services/dashboard.service.js';

/**
 * Get dashboard summary
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
      message: error.message || 'Failed to get summary',
    });
  }
};

/**
 * Get top selling products
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
      message: error.message || 'Failed to get top products',
    });
  }
};

/**
 * Get monthly income data
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
      message: error.message || 'Failed to get monthly income',
    });
  }
};

/**
 * Get weekly income data
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
      message: error.message || 'Failed to get weekly income',
    });
  }
};

/**
 * Get recent transactions
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
      message: error.message || 'Failed to get recent transactions',
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
