const mongoose = require('mongoose');

const partnerChallengeSchema = new mongoose.Schema({
  challengeId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  timeLimit: { type: Number, default: 24 }, // hours
  status: { 
    type: String, 
    enum: ['active', 'completed', 'failed', 'expired'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  completedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date, default: Date.now }
  }],
  reward: {
    xp: { type: Number, default: 50 },
    coins: { type: Number, default: 25 }
  }
});

const duoStreakSchema = new mongoose.Schema({
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCheckIn: {
    user1: { type: Date },
    user2: { type: Date }
  },
  streakHistory: [{
    date: { type: Date, default: Date.now },
    bothCheckedIn: { type: Boolean, default: false },
    user1CheckedIn: { type: Boolean, default: false },
    user2CheckedIn: { type: Boolean, default: false }
  }]
});

const pairBadgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
  criteria: { type: String, required: true }
});

const accountabilityPartnerSchema = new mongoose.Schema({
  partnershipId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `partnership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  user1: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  user2: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'paused', 'ended'], 
    default: 'pending' 
  },
  matchScore: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100 
  },
  matchingCriteria: {
    habitSimilarity: { type: Number, default: 0 },
    timezoneCompatibility: { type: Number, default: 0 },
    activityLevel: { type: Number, default: 0 },
    goalAlignment: { type: Number, default: 0 }
  },
  
  // Gamification Features
  duoStreak: duoStreakSchema,
  
  activeChallenges: [partnerChallengeSchema],
  
  completedChallenges: [partnerChallengeSchema],
  
  earnedBadges: [pairBadgeSchema],
  
  stats: {
    totalChallengesCompleted: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },
    totalCoinsEarned: { type: Number, default: 0 },
    perfectDays: { type: Number, default: 0 }, // Both completed all habits
    supportGiven: { type: Number, default: 0 }, // Messages, encouragements
    supportReceived: { type: Number, default: 0 }
  },
  
  preferences: {
    challengeFrequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'custom'], 
      default: 'daily' 
    },
    notificationSettings: {
      partnerActivity: { type: Boolean, default: true },
      challengeReminders: { type: Boolean, default: true },
      streakAlerts: { type: Boolean, default: true }
    }
  },
  
  // Partnership metadata
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  lastActivity: { type: Date, default: Date.now },
  endedAt: { type: Date },
  endReason: { type: String }
}, {
  timestamps: true
});

// Indexes for efficient querying
accountabilityPartnerSchema.index({ user1: 1, user2: 1 });
accountabilityPartnerSchema.index({ status: 1 });
accountabilityPartnerSchema.index({ matchScore: -1 });
accountabilityPartnerSchema.index({ 'stats.totalXpEarned': -1 });
accountabilityPartnerSchema.index({ 'duoStreak.currentStreak': -1 });

// Methods
accountabilityPartnerSchema.methods.updateDuoStreak = function(user1CheckedIn, user2CheckedIn) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const bothCheckedIn = user1CheckedIn && user2CheckedIn;
  
  // Add to streak history
  this.duoStreak.streakHistory.push({
    date: today,
    bothCheckedIn,
    user1CheckedIn,
    user2CheckedIn
  });
  
  if (bothCheckedIn) {
    this.duoStreak.currentStreak += 1;
    if (this.duoStreak.currentStreak > this.duoStreak.longestStreak) {
      this.duoStreak.longestStreak = this.duoStreak.currentStreak;
    }
  } else {
    this.duoStreak.currentStreak = 0;
  }
  
  this.duoStreak.lastCheckIn = {
    user1: user1CheckedIn ? today : this.duoStreak.lastCheckIn.user1,
    user2: user2CheckedIn ? today : this.duoStreak.lastCheckIn.user2
  };
  
  return this.save();
};

accountabilityPartnerSchema.methods.createChallenge = function(challengeData) {
  const challenge = {
    challengeId: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...challengeData,
    expiresAt: new Date(Date.now() + (challengeData.timeLimit || 24) * 60 * 60 * 1000)
  };
  
  this.activeChallenges.push(challenge);
  return this.save();
};

accountabilityPartnerSchema.methods.completeChallenge = function(challengeId, userId) {
  const challenge = this.activeChallenges.id(challengeId);
  if (!challenge) return null;
  
  // Add user to completed list if not already there
  if (!challenge.completedBy.some(c => c.userId.toString() === userId.toString())) {
    challenge.completedBy.push({ userId });
  }
  
  // Check if both users completed
  if (challenge.completedBy.length >= 2) {
    challenge.status = 'completed';
    this.completedChallenges.push(challenge);
    this.activeChallenges.pull(challengeId);
    this.stats.totalChallengesCompleted += 1;
    this.stats.totalXpEarned += challenge.reward.xp;
    this.stats.totalCoinsEarned += challenge.reward.coins;
  }
  
  return this.save();
};

module.exports = mongoose.model('AccountabilityPartner', accountabilityPartnerSchema);
