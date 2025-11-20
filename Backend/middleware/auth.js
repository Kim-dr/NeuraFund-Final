const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. User not found.',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // if (!user.isEmailVerified) {
    //   return res.status(401).json({
    //     success: false,
    //     error: {
    //       message: 'Email not verified. Please verify your email.',
    //       code: 'EMAIL_NOT_VERIFIED'
    //     }
    //   });
    // }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token.',
          code: 'INVALID_TOKEN'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired.',
          code: 'TOKEN_EXPIRED'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error.',
        code: 'AUTH_ERROR'
      }
    });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Insufficient permissions.',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    next();
  };
};

// Check if user is student
const isStudent = authorize('student');

// Check if user is vendor
const isVendor = authorize('vendor');

module.exports = {
  authenticate,
  authorize,
  isStudent,
  isVendor
};