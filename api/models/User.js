const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50  // Allow spaces, just limit length
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    timezone: { type: String, default: 'UTC' },
    goals: [String],
    level: { type: Number, default: 1 },

    // User statistics
    stats: {
      totalHabitsCompleted: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      totalXpEarned: { type: Number, default: 0 },
      totalCoinsEarned: { type: Number, default: 100 }
    },

    // User preferences
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        habitReminders: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true }
      },
      privacy: {
        profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
        showStats: { type: Boolean, default: true },
        allowPartnerRequests: { type: Boolean, default: true }
      }
    },

    // Simplified Partnership System (embedded in User)
    partnerships: [{
      partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status: { type: String, enum: ['pending', 'active', 'ended'], default: 'pending' },
      matchScore: { type: Number, min: 0, max: 100 },
      createdAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date },
      endedAt: { type: Date }
    }],

    // Partnership requests (sent and received)
    partnerRequests: {
      sent: [{
        to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sentAt: { type: Date, default: Date.now },
        message: { type: String }
      }],
      received: [{
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        receivedAt: { type: Date, default: Date.now },
        message: { type: String }
      }]
    },

    // Enhanced Notifications system
    notifications: [{
      type: {
        type: String,
        enum: [
          'motivation', 'challenge', 'partnership', 'general',
          'achievement', 'streak', 'reminder', 'system',
          'level_up', 'badge_earned', 'habit_milestone'
        ],
        required: true
      },
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fromUsername: { type: String },
      message: { type: String },
      title: { type: String },
      description: { type: String },
      challengeType: { type: String },
      emoji: { type: String },
      reward: { type: String },
      timeLimit: { type: Number },
      customMessage: { type: String },
      status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      actionUrl: { type: String }, // URL for action buttons
      actionText: { type: String }, // Text for action button
      expiresAt: { type: Date }, // For time-sensitive notifications
      metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data
      createdAt: { type: Date, default: Date.now },
      read: { type: Boolean, default: false },
      readAt: { type: Date }
    }],

    // Legacy fields for compatibility
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    badges: [
      {
        badgeId: { type: String, required: true },
        unlockedAt: { type: Date, required: true }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
