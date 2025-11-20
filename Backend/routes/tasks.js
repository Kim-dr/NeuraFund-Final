const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult, query } = require('express-validator');
const { authenticate, isVendor, isStudent } = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Ensure upload directories exist
const uploadDir = 'uploads/task-proofs/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/task-proofs/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation middleware
const validateTask = [
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('pickupLocation').trim().isLength({ min: 3, max: 200 }).withMessage('Pickup location must be between 3 and 200 characters'),
  body('dropoffLocation').trim().isLength({ min: 3, max: 200 }).withMessage('Dropoff location must be between 3 and 200 characters'),
  body('estimatedTime').isInt({ min: 1, max: 1440 }).withMessage('Estimated time must be between 1 and 1440 minutes'),
  body('rewardAmount').isFloat({ min: 1, max: 10000 }).withMessage('Reward amount must be between 1 and 10000')
];

const validateReview = [
  body('approved').isBoolean().withMessage('Approved must be a boolean value'),
  body('reviewNotes').optional().trim().isLength({ max: 500 }).withMessage('Review notes cannot exceed 500 characters')
];

// Get user's tasks (must come before /:id route)
router.get('/my-tasks', authenticate, [
  query('status').optional().isIn(['available', 'in-progress', 'pending-review', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (req.user.role === 'vendor') {
      filter.createdBy = req.user._id;
    } else if (req.user.role === 'student') {
      filter.assignedTo = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName businessName averageRating')
      .populate('assignedTo', 'firstName lastName averageRating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user tasks',
        code: 'USER_TASKS_ERROR'
      }
    });
  }
});

// Get tasks (filtered by role and query parameters)
router.get('/', authenticate, [
  query('status').optional().isIn(['available', 'in-progress', 'pending-review', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('minReward').optional().isFloat({ min: 0 }).withMessage('Minimum reward must be a positive number'),
  query('maxReward').optional().isFloat({ min: 0 }).withMessage('Maximum reward must be a positive number'),
  query('location').optional().trim().isLength({ min: 1 }).withMessage('Location filter cannot be empty'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { status, minReward, maxReward, location, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter based on user role
    let filter = {};
    
    if (req.user.role === 'student') {
      // Students see available tasks or tasks assigned to them
      filter = {
        $or: [
          { status: 'available' },
          { assignedTo: req.user._id }
        ]
      };
    } else if (req.user.role === 'vendor') {
      // Vendors see only their own tasks
      filter.createdBy = req.user._id;
    }

    // Apply additional filters
    if (status) {
      if (req.user.role === 'student' && status !== 'available') {
        filter = { assignedTo: req.user._id, status };
      } else if (req.user.role === 'vendor') {
        filter.status = status;
      } else {
        filter.status = status;
      }
    }

    if (minReward || maxReward) {
      filter.rewardAmount = {};
      if (minReward) filter.rewardAmount.$gte = parseFloat(minReward);
      if (maxReward) filter.rewardAmount.$lte = parseFloat(maxReward);
    }

    if (location) {
      filter.$or = [
        { pickupLocation: { $regex: location, $options: 'i' } },
        { dropoffLocation: { $regex: location, $options: 'i' } }
      ];
    }

    // Get tasks with populated vendor data
    let tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName businessName averageRating')
      .populate('assignedTo', 'firstName lastName averageRating')
      .skip(skip)
      .limit(parseInt(limit));

    // Sort tasks - prioritize high-rated vendors for students viewing available tasks
    if (req.user.role === 'student' && (!status || status === 'available')) {
      tasks = tasks.sort((a, b) => {
        // First sort by vendor rating (descending)
        const ratingDiff = (b.createdBy.averageRating || 0) - (a.createdBy.averageRating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        
        // Then by reward amount (descending)
        const rewardDiff = b.rewardAmount - a.rewardAmount;
        if (rewardDiff !== 0) return rewardDiff;
        
        // Finally by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      // Default sort by creation date
      tasks = tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get tasks',
        code: 'TASKS_ERROR'
      }
    });
  }
});

// Create new task (vendors only)
router.post('/', authenticate, isVendor, validateTask, async (req, res) => {
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

    const { description, pickupLocation, dropoffLocation, estimatedTime, rewardAmount } = req.body;

    // Check if vendor has sufficient balance
    if (req.user.walletBalance < rewardAmount) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Insufficient wallet balance to create this task',
          code: 'INSUFFICIENT_BALANCE'
        }
      });
    }

    const task = new Task({
      description,
      pickupLocation,
      dropoffLocation,
      estimatedTime,
      rewardAmount,
      createdBy: req.user._id
    });

    await task.save();
    await task.populate('createdBy', 'firstName lastName businessName averageRating');

    res.status(201).json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create task',
        code: 'CREATE_TASK_ERROR'
      }
    });
  }
});

// Get specific task details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName businessName averageRating')
      .populate('assignedTo', 'firstName lastName averageRating');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        }
      });
    }

    // Check access permissions
    const isCreator = task.createdBy._id.toString() === req.user._id.toString();
    const isAssigned = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();
    const canViewAsStudent = req.user.role === 'student' && (task.status === 'available' || isAssigned);

    if (!isCreator && !canViewAsStudent) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task details error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get task details',
        code: 'TASK_DETAILS_ERROR'
      }
    });
  }
});

// Assign task to student
router.put('/:id/assign', authenticate, isStudent, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        }
      });
    }

    if (task.status !== 'available') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Task is not available for assignment',
          code: 'TASK_NOT_AVAILABLE'
        }
      });
    }

    if (task.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot assign your own task',
          code: 'CANNOT_ASSIGN_OWN_TASK'
        }
      });
    }

    task.assignedTo = req.user._id;
    task.status = 'in-progress';
    await task.save();

    await task.populate('createdBy', 'firstName lastName businessName');
    await task.populate('assignedTo', 'firstName lastName');

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to assign task',
        code: 'ASSIGN_TASK_ERROR'
      }
    });
  }
});

// Submit completion proof
router.put('/:id/submit-proof', authenticate, isStudent, upload.array('proofFiles', 5), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        }
      });
    }

    if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Task not assigned to you',
          code: 'TASK_NOT_ASSIGNED'
        }
      });
    }

    if (task.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Task is not in progress',
          code: 'TASK_NOT_IN_PROGRESS'
        }
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'At least one proof file is required',
          code: 'NO_PROOF_FILES'
        }
      });
    }

    // Add proof files to task
    const proofFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    task.proof = proofFiles;
    task.status = 'pending-review';
    await task.save();

    await task.populate('createdBy', 'firstName lastName businessName');
    await task.populate('assignedTo', 'firstName lastName');

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Submit proof error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to submit proof',
        code: 'SUBMIT_PROOF_ERROR'
      }
    });
  }
});

// Review task proof
router.put('/:id/review', authenticate, isVendor, validateReview, async (req, res) => {
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

    const { approved, reviewNotes } = req.body;
    const task = await Task.findById(req.params.id).populate('assignedTo');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        }
      });
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to review this task',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    if (task.status !== 'pending-review') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Task is not pending review',
          code: 'TASK_NOT_PENDING_REVIEW'
        }
      });
    }

    if (approved) {
      // Approve task and process payment
      const vendor = await User.findById(req.user._id);
      const student = task.assignedTo;

      // Check vendor has sufficient balance
      if (vendor.walletBalance < task.rewardAmount) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Insufficient balance to complete payment',
            code: 'INSUFFICIENT_BALANCE'
          }
        });
      }

      // Process payment
      vendor.walletBalance -= task.rewardAmount;
      student.walletBalance += task.rewardAmount;

      await vendor.save();
      await student.save();

      // Create transaction records
      const vendorTransaction = new Transaction({
        userId: vendor._id,
        type: 'task-payment',
        amount: task.rewardAmount, // Correct: Send the positive amount (1 ksh)
        description: `Payment for task: ${task.description.substring(0, 50)}...`,
        taskId: task._id,
        status: 'completed'
      });

      const studentTransaction = new Transaction({
        userId: student._id,
        type: 'task-payment',
        amount: task.rewardAmount,
        description: `Payment received for task: ${task.description.substring(0, 50)}...`,
        taskId: task._id,
        status: 'completed'
      });

      await vendorTransaction.save();
      await studentTransaction.save();

      task.status = 'completed';
    } else {
      // Reject task - return to in-progress
      task.status = 'in-progress';
      task.proof = []; // Clear proof files for resubmission
    }

    task.reviewNotes = reviewNotes;
    await task.save();

    await task.populate('createdBy', 'firstName lastName businessName');
    await task.populate('assignedTo', 'firstName lastName');

    res.json({
      success: true,
      data: { 
        task,
        paymentProcessed: approved
      }
    });
  } catch (error) {
    console.error('Review proof error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to review proof',
        code: 'REVIEW_PROOF_ERROR'
      }
    });
  }
});

// Get proof file (with access control)
router.get('/:id/proof/:filename', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        }
      });
    }

    // Check access permissions
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isCreator && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }
      });
    }

    // Check if file exists in task proof
    const proofFile = task.proof.find(p => p.filename === req.params.filename);
    if (!proofFile) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Proof file not found',
          code: 'PROOF_FILE_NOT_FOUND'
        }
      });
    }

    const filePath = path.join(__dirname, '../uploads/task-proofs', req.params.filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get proof file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get proof file',
        code: 'PROOF_FILE_ERROR'
      }
    });
  }
});

module.exports = router;