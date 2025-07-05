const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      minlength: [1, 'Challenge title cannot be empty']
    },
    description: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function(value) {
          // Only validate for new documents or when startDate is being modified
          if (this.isNew || this.isModified('startDate')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(value);
            startDate.setHours(0, 0, 0, 0);

            return startDate >= today;
          }
          return true;
        },
        message: 'Start date cannot be in the past'
      }
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(value) {
          // Validate that end date is after start date
          if (this.startDate) {
            return new Date(value) > new Date(this.startDate);
          }
          return true;
        },
        message: 'End date must be after start date'
      }
    },

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    progress: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        progress: {
          type: Number,
          default: 0,
          min: [0, 'Progress cannot be negative'],
          max: [100, 'Progress cannot exceed 100%']
        },
        lastUpdated: { type: Date, default: Date.now }
      }
    ],

    rewardPoints: {
      type: Number,
      default: 0,
      min: [0, 'Reward points cannot be negative']
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'completed'],
        message: 'Status must be pending, active, or completed'
      },
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Pre-save middleware for additional validation
ChallengeSchema.pre('save', function(next) {
  // Ensure end date is after start date
  if (this.startDate && this.endDate) {
    if (new Date(this.endDate) <= new Date(this.startDate)) {
      const error = new Error('End date must be after start date');
      error.name = 'ValidationError';
      return next(error);
    }
  }

  // Auto-update status based on dates
  const now = new Date();
  if (this.startDate && this.endDate) {
    if (now < this.startDate) {
      this.status = 'pending';
    } else if (now >= this.startDate && now <= this.endDate) {
      if (this.status === 'pending') {
        this.status = 'active';
      }
    } else if (now > this.endDate) {
      this.status = 'completed';
    }
  }

  next();
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
