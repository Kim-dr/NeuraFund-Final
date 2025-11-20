const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  pickupLocation: {
    type: String,
    required: [true, 'Pickup location is required'],
    trim: true
  },
  dropoffLocation: {
    type: String,
    required: [true, 'Dropoff location is required'],
    trim: true
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Estimated time is required'],
    min: [1, 'Estimated time must be at least 1 minute']
  },
  rewardAmount: {
    type: Number,
    required: [true, 'Reward amount is required'],
    min: [1, 'Reward amount must be at least 1']
  },
  status: {
    type: String,
    enum: ['available', 'in-progress', 'pending-review', 'completed', 'cancelled'],
    default: 'available'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  proof: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for performance
taskSchema.index({ status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ rewardAmount: -1 });
taskSchema.index({ createdAt: -1 });

// Compound indexes
taskSchema.index({ status: 1, rewardAmount: -1 });
taskSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);