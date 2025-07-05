const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

const testUsers = [
  {
    username: 'sandesh_gautam',
    email: 'sandesh@mail.com',
    password: 'sandesh@123',
    fullName: 'Sandesh Gautam'
  },
  {
    username: 'pratik_shrestha',
    email: 'pratik@mail.com',
    password: 'pratik@123',
    fullName: 'Pratik Shrestha'
  },
  {
    username: 'sujan_karki',
    email: 'sujan@mail.com',
    password: 'sujan@123',
    fullName: 'Sujan Karki'
  },
  {
    username: 'anisha_thapa',
    email: 'anisha@mail.com',
    password: 'anisha@123',
    fullName: 'Anisha Thapa'
  },
  {
    username: 'sagar_bhandari',
    email: 'sagar@mail.com',
    password: 'sagar@123',
    fullName: 'Sagar Bhandari'
  },
  {
    username: 'nirajan_acharya',
    email: 'nirajan@mail.com',
    password: 'nirajan@123',
    fullName: 'Nirajan Acharya'
  },
  {
    username: 'sita_tamang',
    email: 'sita@mail.com',
    password: 'sita@123',
    fullName: 'Sita Tamang'
  },
  {
    username: 'ramesh_neupane',
    email: 'ramesh@mail.com',
    password: 'ramesh@123',
    fullName: 'Ramesh Neupane'
  },
  {
    username: 'kabita_maharjan',
    email: 'kabita@mail.com',
    password: 'kabita@123',
    fullName: 'Kabita Maharjan'
  },
  {
    username: 'dipesh_basnet',
    email: 'dipesh@mail.com',
    password: 'dipesh@123',
    fullName: 'Dipesh Basnet'
  },
  {
    username: 'sarita_rai',
    email: 'sarita@mail.com',
    password: 'sarita@123',
    fullName: 'Sarita Rai'
  },
  {
    username: 'bikash_poudel',
    email: 'bikash@mail.com',
    password: 'bikash@123',
    fullName: 'Bikash Poudel'
  }
];

const registerTestUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('👥 Starting user registration...');
    
    const registeredUsers = [];
    const skippedUsers = [];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { email: userData.email },
            { username: userData.username }
          ]
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.fullName} (${userData.email}) already exists - skipping`);
          skippedUsers.push(userData);
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create new user
        const newUser = new User({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: 'user',
          isActive: true,
          timezone: 'UTC',
          goals: ['health', 'productivity', 'wellness'], // Default goals
          level: 1,
          stats: {
            totalHabitsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalXpEarned: 0,
            totalCoinsEarned: 100 // Starting coins
          },
          preferences: {
            notifications: {
              email: true,
              push: true,
              habitReminders: true,
              weeklyReports: true
            },
            privacy: {
              profileVisibility: 'public',
              showStats: true,
              allowPartnerRequests: true
            }
          }
        });

        await newUser.save();
        
        console.log(`✅ Successfully registered: ${userData.fullName} (${userData.email})`);
        registeredUsers.push({
          name: userData.fullName,
          email: userData.email,
          username: userData.username,
          id: newUser._id
        });

      } catch (error) {
        console.error(`❌ Error registering ${userData.fullName}:`, error.message);
      }
    }

    // Summary
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registeredUsers.length} users`);
    console.log(`⚠️  Skipped (already exist): ${skippedUsers.length} users`);
    console.log(`❌ Failed: ${testUsers.length - registeredUsers.length - skippedUsers.length} users`);

    if (registeredUsers.length > 0) {
      console.log('\n👥 Newly Registered Users:');
      registeredUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.username}) - ${user.email}`);
        console.log(`   ID: ${user.id}`);
      });
    }

    if (skippedUsers.length > 0) {
      console.log('\n⚠️  Skipped Users (Already Exist):');
      skippedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName} - ${user.email}`);
      });
    }

    // Create some sample habits for the registered users
    if (registeredUsers.length > 0) {
      console.log('\n🎯 Creating sample habits for new users...');
      await createSampleHabits(registeredUsers);
    }

  } catch (error) {
    console.error('❌ Error in user registration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

const createSampleHabits = async (users) => {
  const Habit = require('../models/Habit');
  
  const sampleHabits = [
    {
      title: 'Morning Exercise',
      description: '30 minutes of physical activity',
      category: 'health',
      difficulty: 'medium',
      frequency: 'daily'
    },
    {
      title: 'Read for 20 minutes',
      description: 'Read books or articles for learning',
      category: 'learning',
      difficulty: 'easy',
      frequency: 'daily'
    },
    {
      title: 'Drink 8 glasses of water',
      description: 'Stay hydrated throughout the day',
      category: 'health',
      difficulty: 'easy',
      frequency: 'daily'
    },
    {
      title: 'Meditation',
      description: '10 minutes of mindfulness meditation',
      category: 'wellness',
      difficulty: 'easy',
      frequency: 'daily'
    },
    {
      title: 'Plan tomorrow',
      description: 'Write down tasks for the next day',
      category: 'productivity',
      difficulty: 'easy',
      frequency: 'daily'
    }
  ];

  for (const user of users) {
    try {
      // Create 3-4 random habits for each user
      const userHabits = sampleHabits
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 2) + 3); // 3-4 habits

      for (const habitData of userHabits) {
        const habit = new Habit({
          ...habitData,
          userId: user.id,
          isActive: true,
          createdAt: new Date(),
          streak: Math.floor(Math.random() * 5), // Random streak 0-4
          completionHistory: []
        });

        await habit.save();
      }

      console.log(`   ✅ Created ${userHabits.length} habits for ${user.name}`);
    } catch (error) {
      console.error(`   ❌ Error creating habits for ${user.name}:`, error.message);
    }
  }
};

// Run if called directly
if (require.main === module) {
  registerTestUsers();
}

module.exports = registerTestUsers;
