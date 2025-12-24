import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  // Since we only have one admin user, just check if user is authenticated
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

export default authMiddleware;
