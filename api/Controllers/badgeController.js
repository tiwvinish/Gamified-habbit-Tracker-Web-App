const Badge = require('../models/Badge');

// Get all badges
const getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ message: 'Server error fetching badges' });
  }
};

// Get badge by ID
const getBadgeById = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) return res.status(404).json({ message: 'Badge not found' });
    res.json(badge);
  } catch (error) {
    console.error('Error fetching badge:', error);
    res.status(500).json({ message: 'Server error fetching badge' });
  }
};

// Create a new badge
const createBadge = async (req, res) => {
  try {
    const { badgeId, name, description, icon, requirement } = req.body;

    if (!badgeId || !name || !description) {
      return res.status(400).json({ message: 'Badge ID, name, and description are required' });
    }

    const existingBadge = await Badge.findOne({ badgeId });
    if (existingBadge) return res.status(400).json({ message: 'Badge ID already exists' });

    const badge = new Badge({
      badgeId,
      name,
      description,
      icon: icon || '🏆',
      requirement: requirement || ''
    });

    await badge.save();
    console.log('✅ Badge created:', badge);
    res.status(201).json(badge);
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({ message: 'Server error creating badge' });
  }
};

// Update a badge
const updateBadge = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) return res.status(404).json({ message: 'Badge not found' });

    Object.assign(badge, req.body);
    await badge.save();
    res.json(badge);
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({ message: 'Server error updating badge' });
  }
};

// Delete a badge
const deleteBadge = async (req, res) => {
  try {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error deleting badge' });
  }
};

// Check and unlock badges for a user
const checkAndUnlockBadges = async (req, res) => {
  try {
    console.log('🏆 Checking badges for user:', req.user.id);

    const userId = req.user.id;
    const User = require('../models/User');
    const Habit = require('../models/Habit');
    const { calculateConsecutiveStreak } = require('../utils/streakCalculator');

    // Get user and their habits
    const user = await User.findById(userId);
    const habits = await Habit.find({ user: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`📊 User has ${habits.length} habits`);

    // Calculate user statistics
    const totalCompletions = habits.reduce((total, habit) => total + habit.completedDates.length, 0);
    const streaks = habits.map(habit => calculateConsecutiveStreak(habit.completedDates));
    const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const habitCount = habits.length;

    // Calculate total XP
    const totalXP = habits.reduce((total, habit) => total + (habit.pointsEarned || 0), 0);

    // Calculate consistency (habits completed in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let consistentHabits = 0;
    habits.forEach(habit => {
      const recentCompletions = habit.completedDates.filter(date =>
        new Date(date) >= thirtyDaysAgo
      ).length;
      if (recentCompletions >= 24) { // 80% of 30 days
        consistentHabits++;
      }
    });

    console.log(`📈 Stats - Completions: ${totalCompletions}, Max Streak: ${maxStreak}, Habits: ${habitCount}, XP: ${totalXP}`);

    // Define badge criteria
    const badgeCriteria = [
      {
        badgeId: 'first_habit',
        name: 'First Steps',
        description: 'Complete your first habit',
        icon: '🎯',
        check: () => totalCompletions >= 1
      },
      {
        badgeId: 'week_streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        check: () => maxStreak >= 7
      },
      {
        badgeId: 'habit_master',
        name: 'Habit Master',
        description: 'Create 10 different habits',
        icon: '👑',
        check: () => habitCount >= 10
      },
      {
        badgeId: 'consistency_champion',
        name: 'Consistency Champion',
        description: 'Maintain 80% completion rate for 30 days',
        icon: '🏆',
        check: () => consistentHabits >= 1
      },
      {
        badgeId: 'streak_legend',
        name: 'Streak Legend',
        description: 'Achieve a 30-day streak',
        icon: '⚡',
        check: () => maxStreak >= 30
      },
      {
        badgeId: 'habit_collector',
        name: 'Habit Collector',
        description: 'Create 5 different habits',
        icon: '📚',
        check: () => habitCount >= 5
      },
      {
        badgeId: 'dedication_master',
        name: 'Dedication Master',
        description: 'Complete 100 habits total',
        icon: '💎',
        check: () => totalCompletions >= 100
      },
      {
        badgeId: 'xp_warrior',
        name: 'XP Warrior',
        description: 'Earn 1000 XP total',
        icon: '⭐',
        check: () => totalXP >= 1000
      }
    ];

    // Check which badges should be unlocked
    const newBadges = [];
    const currentBadgeIds = user.badges.map(b => b.badgeId);

    for (const badge of badgeCriteria) {
      if (!currentBadgeIds.includes(badge.badgeId) && badge.check()) {
        newBadges.push({
          badgeId: badge.badgeId,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          unlockedAt: new Date()
        });
        console.log(`🎉 New badge unlocked: ${badge.name}`);
      }
    }

    // Update user with new badges
    if (newBadges.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $push: {
          badges: { $each: newBadges }
        }
      });

      console.log(`✅ ${newBadges.length} new badges added to user`);
    }

    res.json({
      success: true,
      newBadges: newBadges,
      totalBadges: user.badges.length + newBadges.length,
      message: newBadges.length > 0
        ? `Congratulations! You unlocked ${newBadges.length} new badge(s)!`
        : 'No new badges unlocked'
    });

  } catch (error) {
    console.error('❌ Error checking badges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check badges',
      error: error.message
    });
  }
};

// Auto-check badges after habit completion
const autoCheckBadges = async (userId) => {
  try {
    console.log('🔄 Auto-checking badges for user:', userId);

    const User = require('../models/User');
    const Habit = require('../models/Habit');
    const { calculateConsecutiveStreak } = require('../utils/streakCalculator');

    const user = await User.findById(userId);
    const habits = await Habit.find({ user: userId });

    if (!user || !habits) return;

    // Calculate statistics
    const totalCompletions = habits.reduce((total, habit) => total + habit.completedDates.length, 0);
    const streaks = habits.map(habit => calculateConsecutiveStreak(habit.completedDates));
    const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const habitCount = habits.length;
    const totalXP = habits.reduce((total, habit) => total + (habit.pointsEarned || 0), 0);

    // Badge criteria (same as above)
    const badgeCriteria = [
      { badgeId: 'first_habit', check: () => totalCompletions >= 1 },
      { badgeId: 'week_streak', check: () => maxStreak >= 7 },
      { badgeId: 'habit_master', check: () => habitCount >= 10 },
      { badgeId: 'streak_legend', check: () => maxStreak >= 30 },
      { badgeId: 'habit_collector', check: () => habitCount >= 5 },
      { badgeId: 'dedication_master', check: () => totalCompletions >= 100 },
      { badgeId: 'xp_warrior', check: () => totalXP >= 1000 }
    ];

    // Check for new badges
    const currentBadgeIds = user.badges.map(b => b.badgeId);
    const newBadges = [];

    for (const badge of badgeCriteria) {
      if (!currentBadgeIds.includes(badge.badgeId) && badge.check()) {
        newBadges.push({
          badgeId: badge.badgeId,
          unlockedAt: new Date()
        });
      }
    }

    // Update user if new badges found
    if (newBadges.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $push: { badges: { $each: newBadges } }
      });
      console.log(`🎉 Auto-unlocked ${newBadges.length} badges for user ${userId}`);
    }

    return newBadges;
  } catch (error) {
    console.error('❌ Error in auto-check badges:', error);
    return [];
  }
};

module.exports = {
  getAllBadges,
  getBadgeById,
  createBadge,
  updateBadge,
  deleteBadge,
  checkAndUnlockBadges,
  autoCheckBadges
};
