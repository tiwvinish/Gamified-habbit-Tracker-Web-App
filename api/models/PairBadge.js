const mongoose = require('mongoose');

const pairBadgeDefinitionSchema = new mongoose.Schema({
  badgeId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['streak', 'challenge', 'support', 'milestone', 'special'], 
    required: true 
  },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'], 
    default: 'common' 
  },
  criteria: {
    type: { 
      type: String, 
      enum: ['streak', 'challenges_completed', 'perfect_days', 'support_given', 'xp_earned', 'custom'], 
      required: true 
    },
    value: { 
      type: Number, 
      required: true 
    },
    timeframe: { 
      type: String, 
      enum: ['all_time', 'monthly', 'weekly', 'daily'], 
      default: 'all_time' 
    }
  },
  rewards: {
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    title: { type: String }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-defined pair badges
const defaultPairBadges = [
  {
    badgeId: 'perfect_pair',
    name: 'Perfect Pair',
    description: 'Complete 7 days in a row together',
    icon: '👫',
    category: 'streak',
    rarity: 'common',
    criteria: { type: 'streak', value: 7 },
    rewards: { xp: 100, coins: 50 }
  },
  {
    badgeId: 'habit_heroes',
    name: 'Habit Heroes',
    description: 'Complete 10 challenges together',
    icon: '🦸',
    category: 'challenge',
    rarity: 'rare',
    criteria: { type: 'challenges_completed', value: 10 },
    rewards: { xp: 200, coins: 100 }
  },
  {
    badgeId: 'unstoppable_duo',
    name: 'Unstoppable Duo',
    description: 'Maintain a 30-day streak together',
    icon: '🔥',
    category: 'streak',
    rarity: 'epic',
    criteria: { type: 'streak', value: 30 },
    rewards: { xp: 500, coins: 250, title: 'Unstoppable' }
  },
  {
    badgeId: 'support_squad',
    name: 'Support Squad',
    description: 'Give 50 encouragements to each other',
    icon: '🤝',
    category: 'support',
    rarity: 'common',
    criteria: { type: 'support_given', value: 50 },
    rewards: { xp: 150, coins: 75 }
  },
  {
    badgeId: 'challenge_champions',
    name: 'Challenge Champions',
    description: 'Complete 25 challenges together',
    icon: '🏆',
    category: 'challenge',
    rarity: 'epic',
    criteria: { type: 'challenges_completed', value: 25 },
    rewards: { xp: 400, coins: 200 }
  },
  {
    badgeId: 'perfect_month',
    name: 'Perfect Month',
    description: 'Have 30 perfect days together',
    icon: '⭐',
    category: 'milestone',
    rarity: 'legendary',
    criteria: { type: 'perfect_days', value: 30 },
    rewards: { xp: 1000, coins: 500, title: 'Perfect Partners' }
  },
  {
    badgeId: 'early_birds',
    name: 'Early Birds',
    description: 'Complete morning habits together for 14 days',
    icon: '🌅',
    category: 'special',
    rarity: 'rare',
    criteria: { type: 'custom', value: 14 },
    rewards: { xp: 250, coins: 125 }
  },
  {
    badgeId: 'night_owls',
    name: 'Night Owls',
    description: 'Complete evening habits together for 14 days',
    icon: '🦉',
    category: 'special',
    rarity: 'rare',
    criteria: { type: 'custom', value: 14 },
    rewards: { xp: 250, coins: 125 }
  },
  {
    badgeId: 'weekend_warriors',
    name: 'Weekend Warriors',
    description: 'Complete weekend challenges for 8 weeks',
    icon: '⚔️',
    category: 'special',
    rarity: 'epic',
    criteria: { type: 'custom', value: 8 },
    rewards: { xp: 350, coins: 175 }
  },
  {
    badgeId: 'motivation_masters',
    name: 'Motivation Masters',
    description: 'Give 100 motivational messages',
    icon: '💪',
    category: 'support',
    rarity: 'rare',
    criteria: { type: 'support_given', value: 100 },
    rewards: { xp: 300, coins: 150 }
  },
  {
    badgeId: 'streak_legends',
    name: 'Streak Legends',
    description: 'Achieve a 100-day streak together',
    icon: '🔥',
    category: 'streak',
    rarity: 'legendary',
    criteria: { type: 'streak', value: 100 },
    rewards: { xp: 2000, coins: 1000, title: 'Legendary Partners' }
  },
  {
    badgeId: 'xp_millionaires',
    name: 'XP Millionaires',
    description: 'Earn 10,000 XP together',
    icon: '💎',
    category: 'milestone',
    rarity: 'legendary',
    criteria: { type: 'xp_earned', value: 10000 },
    rewards: { xp: 1500, coins: 750, title: 'XP Masters' }
  }
];

// Methods
pairBadgeDefinitionSchema.statics.initializeDefaultBadges = async function() {
  try {
    for (const badge of defaultPairBadges) {
      await this.findOneAndUpdate(
        { badgeId: badge.badgeId },
        badge,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Default pair badges initialized');
  } catch (error) {
    console.error('❌ Error initializing default pair badges:', error);
  }
};

pairBadgeDefinitionSchema.statics.checkBadgeEligibility = function(partnershipStats, criteria) {
  switch (criteria.type) {
    case 'streak':
      return partnershipStats.duoStreak?.currentStreak >= criteria.value;
    case 'challenges_completed':
      return partnershipStats.stats?.totalChallengesCompleted >= criteria.value;
    case 'perfect_days':
      return partnershipStats.stats?.perfectDays >= criteria.value;
    case 'support_given':
      return partnershipStats.stats?.supportGiven >= criteria.value;
    case 'xp_earned':
      return partnershipStats.stats?.totalXpEarned >= criteria.value;
    default:
      return false;
  }
};

module.exports = mongoose.model('PairBadgeDefinition', pairBadgeDefinitionSchema);
