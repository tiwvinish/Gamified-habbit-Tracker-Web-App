/**
 * Recalculate Streaks Migration Script
 * Updates all existing habits to use true consecutive day streaks
 */

const mongoose = require('mongoose');
const Habit = require('./models/Habit');
const { calculateConsecutiveStreak } = require('./utils/streakCalculator');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/merohabbit');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const recalculateAllStreaks = async () => {
  try {
    console.log('🔄 Starting streak recalculation for all habits...\n');

    // Get all habits
    const habits = await Habit.find({});
    console.log(`📊 Found ${habits.length} habits to process\n`);

    let updatedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;

    for (const habit of habits) {
      try {
        const oldStreak = habit.streak;
        const newStreak = calculateConsecutiveStreak(habit.completedDates);

        console.log(`\n📝 Processing: "${habit.title}"`);
        console.log(`   User: ${habit.user}`);
        console.log(`   Completions: ${habit.completedDates.length}`);
        console.log(`   Old streak: ${oldStreak}`);
        console.log(`   New streak: ${newStreak}`);

        if (oldStreak !== newStreak) {
          habit.streak = newStreak;
          await habit.save();
          updatedCount++;
          
          if (newStreak > oldStreak) {
            console.log(`   ✅ Updated (increased): ${oldStreak} → ${newStreak}`);
          } else {
            console.log(`   📉 Updated (corrected): ${oldStreak} → ${newStreak}`);
          }
        } else {
          unchangedCount++;
          console.log(`   ➡️ No change needed: ${newStreak}`);
        }

        // Show recent completion dates for context
        if (habit.completedDates.length > 0) {
          const recentDates = habit.completedDates
            .slice(-5)
            .map(date => new Date(date).toISOString().split('T')[0])
            .join(', ');
          console.log(`   📅 Recent completions: ${recentDates}`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing habit "${habit.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Streak recalculation completed!');
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} habits`);
    console.log(`   ➡️ Unchanged: ${unchangedCount} habits`);
    console.log(`   ❌ Errors: ${errorCount} habits`);
    console.log(`   📊 Total processed: ${habits.length} habits`);

    // Show some statistics
    const totalStreaks = await Habit.aggregate([
      {
        $group: {
          _id: null,
          totalStreaks: { $sum: '$streak' },
          maxStreak: { $max: '$streak' },
          avgStreak: { $avg: '$streak' },
          habitsWithStreaks: {
            $sum: { $cond: [{ $gt: ['$streak', 0] }, 1, 0] }
          }
        }
      }
    ]);

    if (totalStreaks.length > 0) {
      const stats = totalStreaks[0];
      console.log('\n📈 Updated Streak Statistics:');
      console.log(`   🔥 Total streak days: ${stats.totalStreaks}`);
      console.log(`   🏆 Longest streak: ${stats.maxStreak} days`);
      console.log(`   📊 Average streak: ${stats.avgStreak.toFixed(1)} days`);
      console.log(`   ✅ Habits with active streaks: ${stats.habitsWithStreaks}`);
    }

  } catch (error) {
    console.error('❌ Error during streak recalculation:', error);
  }
};

const main = async () => {
  await connectDB();
  await recalculateAllStreaks();
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
  console.log('✨ Migration completed successfully!');
};

// Run the migration
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { recalculateAllStreaks };
