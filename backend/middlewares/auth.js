const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Admin } = require('../database');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. No token provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. Admin not found.'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your account has been deactivated.'
      });
    }

    req.user = admin; // ✨ FIX: Changed back from req.admin to req.user
    next();
  } catch (error) {
    console.error('AUTH MIDDLEWARE ERROR:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
    }

    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') { // ✨ FIX: Changed back from req.admin to req.user
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
};

const generateToken = (id, name, role) => {
  return jwt.sign({ id, name, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

module.exports = {
  authenticate,
  requireAdmin,
  generateToken,
  authLimiter
};