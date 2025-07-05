const mongoose = require('mongoose');

const HabitSuggestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate habit names
      trim: true,
      index: true // Add index for faster queries
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true // Add index for category filtering
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy'
    },
    xpReward: {
      type: Number,
      default: 25,
      min: 1,
      max: 100
    },
    icon: {
      type: String,
      default: '🎯'
    },
    tips: [{
      type: String,
      trim: true
    }],
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    estimatedTime: {
      type: String,
      default: '5-10 minutes',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true // Allow deactivating suggestions without deleting
    },
    popularityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true,
    // Add compound indexes for better query performance
    indexes: [
      { category: 1, difficulty: 1 },
      { popularityScore: -1, createdAt: -1 }
    ]
  }
);

// Add text index for search functionality
HabitSuggestionSchema.index({
  title: 'text',
  description: 'text',
  category: 'text'
});

// Pre-save middleware to ensure title uniqueness (case-insensitive)
HabitSuggestionSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    const existingHabit = await this.constructor.findOne({
      title: { $regex: new RegExp(`^${this.title}$`, 'i') },
      _id: { $ne: this._id }
    });

    if (existingHabit) {
      const error = new Error(`Habit suggestion with title "${this.title}" already exists`);
      error.code = 11000; // Duplicate key error code
      return next(error);
    }
  }
  next();
});

// Static method to find or create habit suggestion
HabitSuggestionSchema.statics.findOrCreate = async function(habitData) {
  try {
    // Try to find existing habit (case-insensitive)
    let habit = await this.findOne({
      title: { $regex: new RegExp(`^${habitData.title}$`, 'i') }
    });

    if (habit) {
      return { habit, created: false };
    }

    // Create new habit if not found
    habit = await this.create(habitData);
    return { habit, created: true };
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const habit = await this.findOne({
        title: { $regex: new RegExp(`^${habitData.title}$`, 'i') }
      });
      return { habit, created: false };
    }
    throw error;
  }
};

module.exports = mongoose.model('HabitSuggestion', HabitSuggestionSchema);
