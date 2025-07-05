const mongoose = require('mongoose');
const Badge = require('./models/Badge');
require('dotenv').config();

// All badges from the frontend
const badgesToSeed = [
  // Default badges from HabitContext
  {
    badgeId: 'first_habit',
    name: 'First Steps',
    description: 'Complete your first habit',
    icon: '🎯',
    requirement: 'Complete 1 habit'
  },
  {
    badgeId: 'week_streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    requirement: 'Complete a habit for 7 days in a row'
  },
  {
    badgeId: 'habit_master',
    name: 'Habit Master',
    description: 'Create 10 different habits',
    icon: '👑',
    requirement: 'Create 10 habits'
  },
  // Additional badges from BadgesPage
  {
    badgeId: 'consistency_champion',
    name: 'Consistency Champion',
    description: 'Maintain 80% completion rate for 30 days',
    icon: '🏆',
    requirement: 'Complete habits consistently for a month'
  },
  {
    badgeId: 'streak_legend',
    name: 'Streak Legend',
    description: 'Achieve a 30-day streak',
    icon: '⚡',
    requirement: 'Maintain a 30-day consecutive streak'
  },
  {
    badgeId: 'habit_collector',
    name: 'Habit Collector',
    description: 'Create 5 different habits',
    icon: '📚',
    requirement: 'Create 5 different habits'
  },
  {
    badgeId: 'dedication_master',
    name: 'Dedication Master',
    description: 'Complete 100 habits total',
    icon: '💎',
    requirement: 'Complete 100 habits in total'
  },
  {
    badgeId: 'xp_warrior',
    name: 'XP Warrior',
    description: 'Earn 1000 XP total',
    icon: '⭐',
    requirement: 'Earn 1000 XP from habit completions'
  },
  {
    badgeId: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 morning habits',
    icon: '🌅',
    requirement: 'Complete habits before 9 AM'
  },
  {
    badgeId: 'wellness_warrior',
    name: 'Wellness Warrior',
    description: 'Complete 50 wellness habits',
    icon: '💪',
    requirement: 'Focus on mental and physical health'
  },
  {
    badgeId: 'learning_lover',
    name: 'Learning Lover',
    description: 'Complete 25 learning habits',
    icon: '📚',
    requirement: 'Commit to continuous education'
  }
];

async function seedBadges() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing badges
    await Badge.deleteMany({});
    console.log('Cleared existing badges');

    // Insert all badges
    const insertedBadges = await Badge.insertMany(badgesToSeed);
    console.log(`✅ Successfully inserted ${insertedBadges.length} badges:`);
    
    insertedBadges.forEach((badge, index) => {
      console.log(`${index + 1}. ${badge.name} (${badge.badgeId}) - ${badge.icon}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Badge seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding badges:', error);
  }
}

seedBadges();
