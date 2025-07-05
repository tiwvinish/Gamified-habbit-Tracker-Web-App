const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Habit = require('../models/Habit');

const fixPartnerSystem = async () => {
  try {
    console.log('🔧 Fixing Partner System...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check current state
    const totalUsers = await User.countDocuments({ isActive: true });
    const usersWithHabits = await User.aggregate([
      {
        $lookup: {
          from: 'habits',
          localField: '_id',
          foreignField: 'userId',
          as: 'habits'
        }
      },
      {
        $match: {
          'habits.0': { $exists: true },
          'habits.isActive': true
        }
      },
      {
        $count: 'count'
      }
    ]);

    const usersWithHabitsCount = usersWithHabits[0]?.count || 0;
    console.log(`👥 Active users: ${totalUsers}`);
    console.log(`📋 Users with habits: ${usersWithHabitsCount}`);

    // 2. If not enough users with habits, create some
    if (usersWithHabitsCount < 3) {
      console.log('\n🚀 Creating test users with habits...');
      
      const testUsers = [
        {
          username: 'Alice Johnson',
          email: 'alice@test.com',
          password: 'password123',
          habits: [
            { title: 'Morning Exercise', category: 'Health', difficulty: 'medium' },
            { title: 'Read Daily', category: 'Learning', difficulty: 'easy' },
            { title: 'Meditation', category: 'Wellness', difficulty: 'easy' }
          ]
        },
        {
          username: 'Bob Smith',
          email: 'bob@test.com',
          password: 'password123',
          habits: [
            { title: 'Evening Walk', category: 'Health', difficulty: 'easy' },
            { title: 'Learn Language', category: 'Learning', difficulty: 'medium' },
            { title: 'Gratitude Journal', category: 'Wellness', difficulty: 'easy' }
          ]
        },
        {
          username: 'Carol Davis',
          email: 'carol@test.com',
          password: 'password123',
          habits: [
            { title: 'Yoga Practice', category: 'Health', difficulty: 'medium' },
            { title: 'Online Course', category: 'Learning', difficulty: 'hard' },
            { title: 'Deep Breathing', category: 'Wellness', difficulty: 'easy' }
          ]
        },
        {
          username: 'David Wilson',
          email: 'david@test.com',
          password: 'password123',
          habits: [
            { title: 'Gym Workout', category: 'Health', difficulty: 'hard' },
            { title: 'Practice Coding', category: 'Learning', difficulty: 'medium' },
            { title: 'Plan Tomorrow', category: 'Productivity', difficulty: 'easy' }
          ]
        }
      ];

      for (const userData of testUsers) {
        try {
          // Check if user already exists
          const existingUser = await User.findOne({ email: userData.email });
          if (existingUser) {
            console.log(`⚠️  User ${userData.username} already exists`);
            continue;
          }

          // Hash password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(userData.password, salt);

          // Create user
          const newUser = new User({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            isActive: true,
            timezone: 'UTC+5:45',
            goals: ['health', 'learning', 'wellness'],
            level: Math.floor(Math.random() * 5) + 1,
            stats: {
              totalHabitsCompleted: Math.floor(Math.random() * 50) + 10,
              currentStreak: Math.floor(Math.random() * 10) + 1,
              longestStreak: Math.floor(Math.random() * 20) + 5,
              totalXpEarned: Math.floor(Math.random() * 1000) + 200,
              totalCoinsEarned: Math.floor(Math.random() * 500) + 100
            }
          });

          await newUser.save();
          console.log(`✅ Created user: ${userData.username}`);

          // Create habits for the user
          for (const habitData of userData.habits) {
            const habit = new Habit({
              userId: newUser._id,
              title: habitData.title,
              category: habitData.category,
              difficulty: habitData.difficulty,
              frequency: 'daily',
              isActive: true,
              streak: Math.floor(Math.random() * 10),
              completedDates: [],
              createdAt: new Date()
            });

            await habit.save();
          }

          console.log(`  📝 Created ${userData.habits.length} habits`);

        } catch (error) {
          console.error(`❌ Error creating user ${userData.username}:`, error.message);
        }
      }
    }

    // 3. Update existing users to ensure they have required fields
    console.log('\n🔄 Updating existing users...');
    
    const usersToUpdate = await User.find({ 
      isActive: { $ne: false },
      $or: [
        { isActive: { $exists: false } },
        { timezone: { $exists: false } },
        { stats: { $exists: false } },
        { goals: { $exists: false } }
      ]
    });

    for (const user of usersToUpdate) {
      const updates = {};
      
      if (user.isActive !== true) updates.isActive = true;
      if (!user.timezone) updates.timezone = 'UTC+5:45';
      if (!user.goals || user.goals.length === 0) {
        updates.goals = ['health', 'productivity', 'learning'];
      }
      if (!user.stats) {
        updates.stats = {
          totalHabitsCompleted: Math.floor(Math.random() * 30) + 5,
          currentStreak: Math.floor(Math.random() * 7) + 1,
          longestStreak: Math.floor(Math.random() * 15) + 3,
          totalXpEarned: Math.floor(Math.random() * 800) + 100,
          totalCoinsEarned: Math.floor(Math.random() * 400) + 50
        };
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`🔄 Updated user: ${user.username || user.email}`);
      }
    }

    // 4. Test the partner matching
    console.log('\n🧪 Testing partner matching...');
    const testUser = await User.findOne({ isActive: true });
    
    if (testUser) {
      const { findAccountabilityPartners } = require('../algorithms/partnerMatching');
      
      try {
        const partners = await findAccountabilityPartners(testUser._id, 5);
        console.log(`✅ Partner matching works! Found ${partners.length} partners for ${testUser.username || testUser.email}`);
        
        if (partners.length > 0) {
          console.log('Top matches:');
          partners.slice(0, 3).forEach((partner, index) => {
            console.log(`  ${index + 1}. ${partner.user.username || partner.user.email} - ${partner.matchScore.toFixed(1)}% match`);
          });
        }
      } catch (error) {
        console.error(`❌ Partner matching test failed: ${error.message}`);
      }
    }

    console.log('\n🎉 Partner system fix completed!');
    console.log('💡 Try the "Discover Compatible Partners" button in the frontend now.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixPartnerSystem().catch(console.error);
