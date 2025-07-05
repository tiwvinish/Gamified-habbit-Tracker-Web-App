const express = require('express');
const router = express.Router();

const {
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  markHabitComplete,
  recalculateStreaks,
} = require('../Controllers/habitController');

const authMiddleware = require('../Middleware/authMiddleware');
const adminMiddleware = require('../Middleware/adminMiddleware');

// Admin route to get all habits from all users
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const Habit = require('../models/Habit');
    const habits = await Habit.find({}).populate('user', 'username email');
    res.json(habits);
  } catch (error) {
    console.error('Error getting all habits for admin:', error);
    res.status(500).json({ message: 'Server error getting habits' });
  }
});

// Protected routes - all habit operations require authentication
router.get('/', authMiddleware, getAllHabits);
router.get('/:id', authMiddleware, getHabitById);
router.post('/', authMiddleware, createHabit);
router.put('/:id', authMiddleware, updateHabit);
router.delete('/:id', authMiddleware, deleteHabit);

// Mark habit complete (POST to /api/habits/:id/complete)
router.post('/:id/complete', authMiddleware, markHabitComplete);

// Recalculate all streaks (admin only)
router.post('/recalculate-streaks', authMiddleware, adminMiddleware, recalculateStreaks);

module.exports = router;
