const express = require('express');
const { authenticate } = require('../middleware/auth');
const Rating = require('../models/Rating');
const User = require('../models/User');
const Task = require('../models/Task');

const router = express.Router();

// Submit rating
router.post('/', authenticate, async (req, res) => {
  try {
    // FIX: Change toUserId to toUser to match frontend payload
    const { toUser, taskId, score, comment } = req.body; 

    // Validate required fields
    // FIX: Change toUserId to toUser
    if (!toUser || !taskId || !score) { 
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: toUser, taskId, and score are required.',
          code: 'MISSING_FIELDS'
        }
      });
    }

    // Validate score range
    if (score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Rating score must be between 1 and 5.',
          code: 'INVALID_SCORE'
        }
      });
    }

    // Check if user is trying to rate themselves
    if (req.user._id.toString() === toUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You cannot rate yourself.',
          code: 'SELF_RATING'
        }
      });
    }

    // Verify task exists and is completed
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found.',
          code: 'TASK_NOT_FOUND'
        }
      });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Can only rate users for completed tasks.',
          code: 'TASK_NOT_COMPLETED'
        }
      });
    }

    // Verify user is involved in the task
    const isVendor = task.createdBy.toString() === req.user._id.toString();
    const isStudent = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isVendor && !isStudent) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You can only rate users involved in your tasks.',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    // Verify the toUser is the other party in the task
    const expectedToUserId = isVendor ? task.assignedTo.toString() : task.createdBy.toString();
    // FIX: Change toUserId to toUser
    if (toUser !== expectedToUserId) { 
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid user to rate for this task.',
          code: 'INVALID_TO_USER'
        }
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      fromUser: req.user._id,
      taskId: taskId
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You have already rated this task.',
          code: 'DUPLICATE_RATING'
        }
      });
    }

    // Create rating
    const rating = new Rating({
      fromUser: req.user._id,
      toUser: toUser, // FIX: Use toUser
      taskId: taskId,
      score: score,
      comment: comment || ''
    });

    await rating.save();

    // Update user's average rating
    // FIX: Change toUserId to toUser
    await updateUserRating(toUser); 

    // Populate rating details for response
    await rating.populate('fromUser', 'firstName lastName role');
    await rating.populate('taskId', 'description');

    res.status(201).json({
      success: true,
      data: {
        message: 'Rating submitted successfully',
        rating: rating
      }
    });
  } catch (error) {
    console.error('Rating submission error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You have already rated this task.',
          code: 'DUPLICATE_RATING'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to submit rating',
        code: 'RATING_ERROR'
      }
    });
  }
});

// Get user ratings
router.get('/user/:id', authenticate, async (req, res) => {
// ... (rest of the code remains the same) ...
  try {
    const { id } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // Verify user exists
    const user = await User.findById(id).select('firstName lastName role averageRating totalRatings');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found.',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get ratings for the user
    const ratings = await Rating.find({ toUser: id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('fromUser', 'firstName lastName role')
      .populate('taskId', 'description');

    // Get total count
    const totalCount = await Rating.countDocuments({ toUser: id });

    // Calculate rating distribution
    const ratingDistribution = await Rating.aggregate([
      { $match: { toUser: user._id } },
      { $group: { _id: '$score', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          averageRating: user.averageRating,
          totalRatings: user.totalRatings
        },
        ratings: ratings,
        ratingDistribution: ratingDistribution,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user ratings',
        code: 'GET_RATINGS_ERROR'
      }
    });
  }
});

// Helper function to update user's average rating
async function updateUserRating(userId) {
  try {
    const ratings = await Rating.find({ toUser: userId });
    
    if (ratings.length === 0) {
      await User.findByIdAndUpdate(userId, {
        averageRating: 0,
        totalRatings: 0
      });
      return;
    }

    const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
    const averageRating = totalScore / ratings.length;

    await User.findByIdAndUpdate(userId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Error updating user rating:', error);
    throw error;
  }
}

module.exports = router;