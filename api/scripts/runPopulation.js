const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Habit = require('../models/Habit');

const quickPopulate = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🚀 Quick population starting...');

    // Simple habit templates
    const habits = [
      { title: 'Morning Exercise', category: 'health', difficulty: 'medium' },
      { title: 'Read Daily', category: 'learning', difficulty: 'easy' },
      { title: 'Meditation', category: 'wellness', difficulty: 'easy' },
      { title: 'Plan Day', category: 'productivity', difficulty: 'easy' },
      { title: 'Drink Water', category: 'health', difficulty: 'easy' },
      { title: 'Evening Walk', category: 'health', difficulty: 'easy' },
      { title: 'Gratitude Journal', category: 'wellness', difficulty: 'easy' },
      { title: 'Learn Language', category: 'learning', difficulty: 'medium' }
    ];

    // Get all test users
    const testEmails = [
      'sandesh@mail.com', 'pratik@mail.com', 'sujan@mail.com', 'anisha@mail.com',
      'sagar@mail.com', 'nirajan@mail.com', 'sita@mail.com', 'ramesh@mail.com',
      'kabita@mail.com', 'dipesh@mail.com', 'sarita@mail.com', 'bikash@mail.com'
    ];

    const users = await User.find({ email: { $in: testEmails } });
    console.log(`📋 Found ${users.length} users to update`);

    let updated = 0;
    let habitsCreated = 0;

    for (const user of users) {
      try {
        // Random level between 2-6
        const level = Math.floor(Math.random() * 5) + 2;
        const xp = level * 200 + Math.floor(Math.random() * 100);
        const streak = Math.floor(Math.random() * 20) + 1;
        const completed = level * 10 + Math.floor(Math.random() * 30);

        // Update user stats
        await User.findByIdAndUpdate(user._id, {
          level: level,
          timezone: 'UTC+5:45',
          goals: ['health', 'productivity', 'learning'],
          'stats.totalHabitsCompleted': completed,
          'stats.currentStreak': streak,
          'stats.longestStreak': streak + Math.floor(Math.random() * 10),
          'stats.totalXpEarned': xp,
          'stats.totalCoinsEarned': 100 + level * 50
        });

        // Delete old habits
        await Habit.deleteMany({ userId: user._id });

        // Create 4-6 random habits
        const numHabits = Math.floor(Math.random() * 3) + 4; // 4-6 habits
        const selectedHabits = habits.sort(() => Math.random() - 0.5).slice(0, numHabits);

        for (const habitTemplate of selectedHabits) {
          const habit = new Habit({
            title: habitTemplate.title,
            description: `${habitTemplate.title} for better ${habitTemplate.category}`,
            category: habitTemplate.category,
            difficulty: habitTemplate.difficulty,
            frequency: 'daily',
            userId: user._id,
            isActive: true,
            streak: Math.floor(Math.random() * streak),
            completionHistory: [],
            createdAt: new Date()
          });

          await habit.save();
          habitsCreated++;
        }

        console.log(`✅ ${user.username} - Level ${level}, ${numHabits} habits, ${streak} streak`);
        updated++;

      } catch (error) {
        console.error(`❌ Error updating ${user.username}:`, error.message);
      }
    }

    console.log('\n📊 Population Complete!');
    console.log(`✅ Users updated: ${updated}`);
    console.log(`✅ Habits created: ${habitsCreated}`);
    console.log(`📈 Average habits per user: ${(habitsCreated / updated).toFixed(1)}`);

    // Show final stats
    console.log('\n👥 User Levels:');
    const updatedUsers = await User.find({ email: { $in: testEmails } })
      .select('username level stats.totalXpEarned stats.currentStreak')
      .sort({ level: -1 });

    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - Level ${user.level} (${user.stats.totalXpEarned} XP, ${user.stats.currentStreak} streak)`);
    });

    console.log('\n🎯 Ready for partner matching!');
    console.log('Users now have varied levels, habits, and stats for realistic partner discovery.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the population
quickPopulate().catch(console.error);
