const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    xpReward: { type: Number, default: 25 },
    frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    lastCompleted: { type: Date },
    streak: { type: Number, default: 0 },
    completedDates: [{ type: Date }],
    pointsEarned: { type: Number, default: 0 },
    reminderTime: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Habit', HabitSchema);
