const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rating from user is required']
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rating to user is required']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task reference is required']
  },
  score: {
    type: Number,
    required: [true, 'Rating score is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for performance
ratingSchema.index({ toUser: 1 });
ratingSchema.index({ fromUser: 1 });
ratingSchema.index({ taskId: 1 });

// Compound indexes
ratingSchema.index({ toUser: 1, score: -1 });
ratingSchema.index({ fromUser: 1, taskId: 1 }, { unique: true }); // Prevent duplicate ratings

module.exports = mongoose.model('Rating', ratingSchema);