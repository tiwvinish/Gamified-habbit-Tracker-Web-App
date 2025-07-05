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

    // Find Umesh Shakya
    const user = await User.findOne({ username: 'Umesh Shakya' });
    if (!user) {
      console.log('User not found');
      return;
    }

    // Find all habits for this user
    const habits = await Habit.find({ user: user._id });
    
    // Calculate total points from all habits
    let totalPoints = 0;
    console.log('Calculating points from habits:');
    habits.forEach((habit, index) => {
      console.log(`${index + 1}. ${habit.title}: ${habit.pointsEarned} points`);
      totalPoints += habit.pointsEarned;
    });
    
    console.log('\n=== SUMMARY ===');
    console.log('Current user points:', user.points);
    console.log('Calculated total from habits:', totalPoints);
    console.log('Difference:', totalPoints - user.points);
    
    // Update user points and level
    const newLevel = calculateLevel(totalPoints);
    
    console.log('\nUpdating user...');
    user.points = totalPoints;
    user.level = newLevel;
    
    await user.save();
    
    console.log('✅ User updated:');
    console.log('- Points:', user.points);
    console.log('- Level:', user.level);
    console.log('- Expected level for', user.points, 'points:', calculateLevel(user.points));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUserPoints();
