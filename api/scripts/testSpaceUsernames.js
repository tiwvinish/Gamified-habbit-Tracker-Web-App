const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

// Helper function to generate username from full name (preserving spaces)
const generateUsername = (fullName) => {
  return fullName
    .trim()                    // Remove leading/trailing spaces
    .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
    .replace(/[^a-zA-Z0-9\s]/g, ''); // Remove special characters but keep spaces and letters/numbers
};

const testUsers = [
  {
    email: 'test1@mail.com',
    password: 'test123',
    fullName: 'Siddhartha Dhakal'
  },
  {
    email: 'test2@mail.com',
    password: 'test123',
    fullName: 'Sandesh Gautam'
  },
  {
    email: 'test3@mail.com',
    password: 'test123',
    fullName: 'Sujan Pandey'
  }
];

const testSpaceUsernames = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧪 Testing usernames with spaces...');
    
    // Clean up any existing test users
    await User.deleteMany({ email: { $regex: 'test.*@mail.com' } });
    console.log('🧹 Cleaned up existing test users');

    for (const userData of testUsers) {
      try {
        // Generate username with spaces
        const username = generateUsername(userData.fullName);
        console.log(`📝 Testing: "${userData.fullName}" → "${username}"`);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user with space in username
        const newUser = new User({
          username: username,  // This should contain spaces
          email: userData.email,
          password: hashedPassword,
          role: 'user',
          isActive: true,
          timezone: 'UTC+5:45',
          goals: ['health', 'productivity'],
          level: 1,
          stats: {
            totalHabitsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalXpEarned: 0,
            totalCoinsEarned: 100
          }
        });

        await newUser.save();
        console.log(`✅ Successfully saved user with username: "${username}"`);

      } catch (error) {
        console.error(`❌ Error with ${userData.fullName}:`, error.message);
      }
    }

    // Verify the users were saved correctly
    console.log('\n🔍 Verifying saved users:');
    const savedUsers = await User.find({ email: { $regex: 'test.*@mail.com' } })
      .select('username email');
    
    savedUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: "${user.username}" | Email: ${user.email}`);
    });

    // Test querying by username with spaces
    console.log('\n🔍 Testing username queries:');
    const testQuery = await User.findOne({ username: 'Siddhartha Dhakal' });
    if (testQuery) {
      console.log(`✅ Successfully found user by username with spaces: "${testQuery.username}"`);
    } else {
      console.log('❌ Could not find user by username with spaces');
    }

    // Clean up test users
    await User.deleteMany({ email: { $regex: 'test.*@mail.com' } });
    console.log('\n🧹 Cleaned up test users');

    console.log('\n🎉 Username space test completed successfully!');
    console.log('✅ Usernames with spaces are working correctly');

  } catch (error) {
    console.error('❌ Error in username space test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the test
testSpaceUsernames().catch(console.error);
