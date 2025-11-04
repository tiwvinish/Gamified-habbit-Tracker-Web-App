const Habit = require('../models/Habit');
const User = require('../models/User');
const { calculateConsecutiveStreak } = require('../utils/streakCalculator');
const { recalculateAllStreaks } = require('../recalculateStreaks');

// Helper function to calculate level based on points (200 points per level) and accordingly
const calculateLevel = (points) => {
  return Math.floor(points / 200) + 1;
};

// Get all habits for logged-in user and operate
const getAllHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    res.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ message: 'Server error fetching habits' });
  }
};

// Get habit by ID
const getHabitById = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    res.json(habit);
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ message: 'Server error fetching habit' });
  }
};

// Create new habit
const createHabit = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      xpReward,
      frequency,
      reminderTime,
      streak = 0,
      completedDates = [],
      lastCompleted = null,
      pointsEarned = 0,
    } = req.body;

    const habit = new Habit({
      title,
      description,
      category,
      difficulty,
      xpReward,
      frequency,
      reminderTime,
      streak,
      completedDates,
      lastCompleted,
      pointsEarned,
      user: req.user.id, // Associate habit with logged-in user
    });

    await habit.save();
    res.status(201).json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ message: 'Server error creating habit' });
  }
};

// Update habit
const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    Object.assign(habit, req.body);
    await habit.save();
    res.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ message: 'Server error updating habit' });
  }
};

// Delete habit
const deleteHabit = async (req, res) => {
  console.log('🚀 DELETE HABIT FUNCTION CALLED!');
  try {
    console.log('🗑️ Deleting habit:', req.params.id, 'for user:', req.user?.id);

    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      console.log('❌ Habit not found:', req.params.id);
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if habit belongs to the requesting user
    if (habit.user.toString() !== req.user.id) {
      console.log('❌ Unauthorized delete attempt:', req.user.id, 'trying to delete habit of user:', habit.user);
      return res.status(403).json({ message: 'Not authorized to delete this habit' });
    }

    await Habit.findByIdAndDelete(req.params.id);
    console.log('✅ Habit deleted successfully:', habit.title);
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting habit:', error);
    res.status(500).json({ message: 'Server error deleting habit' });
  }
};

// Mark habit complete for a date
const markHabitComplete = async (req, res) => {
  console.log('🚀 BACKEND: markHabitComplete called');
  console.log('🚀 BACKEND: Habit ID:', req.params.id);
  console.log('🚀 BACKEND: User ID:', req.user?.id);
  console.log('🚀 BACKEND: Request body:', req.body);

  try {
    const { date } = req.body;
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      console.log('❌ BACKEND: Habit not found');
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (!date) return res.status(400).json({ message: 'Date is required' });

    // Check if habit belongs to the authenticated user
    if (habit.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to complete this habit' });
    }

    // Add the date if not already completed
    if (!habit.completedDates.includes(date)) {
      const pointsToAdd = habit.xpReward || 25;
      console.log(`📝 Marking habit complete: ${habit.title}, adding ${pointsToAdd} points`);

      // Update habit
      habit.completedDates.push(date);
      habit.lastCompleted = date;

      // Calculate true consecutive day streak
      const newStreak = calculateConsecutiveStreak(habit.completedDates, date);
      const oldStreak = habit.streak;
      habit.streak = newStreak;
      habit.pointsEarned += pointsToAdd;

      console.log(`🔥 Streak update: ${oldStreak} → ${newStreak} (consecutive days)`);

      // Log streak status
      if (newStreak > oldStreak) {
        console.log(`📈 Streak increased! Now at ${newStreak} consecutive days`);
      } else if (newStreak < oldStreak) {
        console.log(`📉 Streak reset due to missed days. New streak: ${newStreak} days`);
      } else {
        console.log(`➡️ Streak maintained at ${newStreak} consecutive days`);
      }

      // Update user points and level
      try {
        const user = await User.findById(req.user.id);
        if (user) {
          console.log(`👤 User before update: ${user.username}, Points: ${user.points}, Level: ${user.level}`);
          const oldLevel = user.level;
          user.points += pointsToAdd;
          user.level = calculateLevel(user.points);

          console.log(`👤 User after calculation: Points: ${user.points}, Level: ${user.level}`);

          try {
            await user.save();
            console.log(`✅ User saved successfully`);
          } catch (userSaveError) {
            console.error(`❌ Error saving user:`, userSaveError);
            throw userSaveError;
          }

          // Log level up if it happened
          if (user.level > oldLevel) {
            console.log(`🎉 User ${user.username} leveled up from ${oldLevel} to ${user.level}!`);
          }
        } else {
          console.log(`❌ User not found: ${req.user.id}`);
          throw new Error('User not found');
        }
      } catch (userUpdateError) {
        console.error(`❌ Error updating user:`, userUpdateError);
        throw userUpdateError;
      }

      await habit.save();
      console.log(`✅ Habit saved successfully`);

      // Auto-check for badge unlocks after habit completion
      try {
        const { autoCheckBadges } = require('./badgeController');
        const newBadges = await autoCheckBadges(req.user.id);
        if (newBadges && newBadges.length > 0) {
          console.log(`🎉 Auto-unlocked ${newBadges.length} badges for user ${req.user.id}`);
        }
      } catch (badgeError) {
        console.error('❌ Error checking badges:', badgeError);
        // Don't fail the habit completion if badge checking fails
      }
    } else {
      console.log(`⚠️ Habit already completed for date: ${date}`);
    }

    res.json(habit);
  } catch (error) {
    console.error('Error marking habit complete:', error);
    res.status(500).json({ message: 'Server error marking habit complete' });
  }
};

// Recalculate all streaks (admin function)
const recalculateStreaks = async (req, res) => {
  try {
    console.log('🔄 Admin triggered streak recalculation');
    await recalculateAllStreaks();
    res.json({
      message: 'Streak recalculation completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recalculating streaks:', error);
    res.status(500).json({ message: 'Server error recalculating streaks' });
  }
};

module.exports = {
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  markHabitComplete,
  recalculateStreaks,
};
