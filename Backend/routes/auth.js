const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer'); 
const path = require('path');     
// const fs = require('fs'); // 1. IMPORT FS (File System)
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// --- 2. AUTOMATICALLY CREATE UPLOADS FOLDER ---
// This fixes the crash if the folder is missing
const uploadDir = path.join(__dirname, '../uploads');


// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the variable we defined above to be safe
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// --- STUDENT REGISTRATION ---
router.post('/register/student', 
  upload.single('profilePic'), 
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('university').trim().notEmpty()
  ], 
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
          }
        });
      }

      const { email, password, firstName, lastName, university, studentId } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User with this email already exists',
            code: 'USER_EXISTS'
          }
        });
      }

      const user = new User({
        email,
        password,
        role: 'student',
        firstName,
        lastName,
        university,
        studentId,
        isEmailVerified: true,
        profilePicUrl: req.file ? `/uploads/${req.file.filename}` : ''
      });

      await user.save();
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            university: user.university,
            profilePicUrl: user.profilePicUrl,
            isEmailVerified: true 
          }
        }
      });
    } catch (error) {
      console.error('Student registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Registration failed',
          code: 'REGISTRATION_ERROR'
        }
      });
    }
  }
);

// --- VENDOR REGISTRATION ---
router.post('/register/vendor', 
  upload.single('profilePic'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('businessName').trim().notEmpty()
  ], 
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
          }
        });
      }

      const { email, password, firstName, lastName, businessName, businessLocation, goodsType } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User with this email already exists',
            code: 'USER_EXISTS'
          }
        });
      }

      const user = new User({
        email,
        password,
        role: 'vendor',
        firstName,
        lastName,
        businessName,
        businessLocation,
        goodsType,
        isEmailVerified: true,
        profilePicUrl: req.file ? `/uploads/${req.file.filename}` : ''
      });

      await user.save();
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            businessName: user.businessName,
            profilePicUrl: user.profilePicUrl,
            isEmailVerified: true
          }
        }
      });
    } catch (error) {
      console.error('Vendor registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Registration failed',
          code: 'REGISTRATION_ERROR'
        }
      });
    }
  }
);

// --- LOGIN ---
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    const token = generateToken(user._id);

    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      walletBalance: user.walletBalance,
      averageRating: user.averageRating,
      totalRatings: user.totalRatings,
      isEmailVerified: user.isEmailVerified,
      profilePicUrl: user.profilePicUrl
    };

    if (user.role === 'student') {
      userData.university = user.university;
      userData.studentId = user.studentId;
    } else if (user.role === 'vendor') {
      userData.businessName = user.businessName;
      userData.businessLocation = user.businessLocation;
      userData.goodsType = user.goodsType;
    }

    res.json({
      success: true,
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed',
        code: 'LOGIN_ERROR'
      }
    });
  }
});

// --- GET PROFILE ---
router.get('/me', authenticate, async (req, res) => {
  try {
    const userData = {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      walletBalance: req.user.walletBalance,
      averageRating: req.user.averageRating,
      totalRatings: req.user.totalRatings,
      isEmailVerified: req.user.isEmailVerified,
      profilePicUrl: req.user.profilePicUrl
    };

    if (req.user.role === 'student') {
      userData.university = req.user.university;
      userData.studentId = req.user.studentId;
    } else if (req.user.role === 'vendor') {
      userData.businessName = req.user.businessName;
      userData.businessLocation = req.user.businessLocation;
      userData.goodsType = req.user.goodsType;
    }

    res.json({
      success: true,
      data: { user: userData }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user profile',
        code: 'PROFILE_ERROR'
      }
    });
  }
});

// --- LOGOUT ---
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
});

// Email Verification
router.get('/verify-email/:token', async (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/login`);
});

module.exports = router;