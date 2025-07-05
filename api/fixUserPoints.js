const mongoose = require('mongoose');
const User = require('./models/User');
const Habit = require('./models/Habit');
require('dotenv').config();

// Helper function to calculate level based on points (200 points per level)
const calculateLevel = (points) => {
  return Math.floor(points / 200) + 1;
};

async function fixUserPoints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find user Umesh Shakya
    const user = await User.findOne({ username: 'Umesh Shakya' });
    if (!user) {
      console.log('User Umesh Shakya not found');
      return;
    }

    // Find habits for this user
    const habits = await Habit.find({ user: user._id });
    
    // Calculate total points from all habits
    let totalPoints = 0;
    habits.forEach(habit => {
      totalPoints += habit.pointsEarned;
    });
    
    console.log('Current user points:', user.points);
    console.log('Calculated total points from habits:', totalPoints);
    
    // Update user points and level
    const newLevel = calculateLevel(totalPoints);
    
    user.points = totalPoints;
    user.level = newLevel;
    
    await user.save();
    
    console.log('✅ User updated:');
    console.log('- Points:', user.points);
    console.log('- Level:', user.level);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUserPoints();
