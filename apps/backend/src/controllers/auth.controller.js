import authService from '../services/auth.service.js';

/**
 * Login controller
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/**
 * Logout controller (client-side token removal)
 */
export const logout = async (req, res) => {
  try {
    // JWT tokens are stateless, logout is handled client-side
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};

/**
 * Register new admin user
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const result = await authService.register({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export default {
  login,
  logout,
  getProfile,
  register,
};
