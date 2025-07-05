const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Habit = require('../models/Habit');

// Helper function to generate username from full name
const generateUsername = (fullName) => {
  return fullName
    .trim()                    // Remove leading/trailing spaces
    .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
    .replace(/[^a-zA-Z0-9\s]/g, ''); // Remove special characters but keep spaces and letters/numbers
};

const newUsers = [
  {
    email: 'siddhartha@mail.com',
    password: 'siddhartha@123',
    fullName: 'Siddhartha Dhakal'
  },
  {
    email: 'sandesh@mail.com',
    password: 'sandesh@123',
    fullName: 'Sandesh Gautam'
  },
  {
    email: 'sujan@mail.com',
    password: 'sujan@123',
    fullName: 'Sujan Pandey'
  },
  {
    email: 'vinish@mail.com',
    password: 'vinish@123',
    fullName: 'Vinish Tiwari'
  },
  {
    email: 'kiran@mail.com',
    password: 'kiran@123',
    fullName: 'Kiran Oli'
  },
  {
    email: 'bipin@mail.com',
    password: 'bipin@123',
    fullName: 'Bipin Chettri'
  },
  {
    email: 'anupam@mail.com',
    password: 'anupam@123',
    fullName: 'Anupam Shah'
  },
  {
    email: 'shudamshu@mail.com',
    password: 'shudamshu@123',
    fullName: 'Shudamshu Bharati'
  },
  {
    email: 'sonam@mail.com',
    password: 'sonam@123',
    fullName: 'Sonam Tamang'
  }
];

// Diverse habit templates for realistic user profiles
const habitTemplates = [
  // Health & Fitness
  { title: 'Morning Exercise', description: '30 minutes of physical activity', category: 'health', difficulty: 'medium', frequency: 'daily' },
  { title: 'Evening Walk', description: '20 minutes walk after dinner', category: 'health', difficulty: 'easy', frequency: 'daily' },
  { title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day', category: 'health', difficulty: 'easy', frequency: 'daily' },
  { title: 'Yoga Practice', description: '15 minutes of yoga or stretching', category: 'health', difficulty: 'medium', frequency: 'daily' },
  { title: 'Healthy Breakfast', description: 'Eat a nutritious breakfast', category: 'nutrition', difficulty: 'easy', frequency: 'daily' },
  
  // Learning & Development
  { title: 'Read for 30 minutes', description: 'Read books or educational content', category: 'learning', difficulty: 'easy', frequency: 'daily' },
  { title: 'Learn New Language', description: 'Practice language skills for 20 minutes', category: 'learning', difficulty: 'medium', frequency: 'daily' },
  { title: 'Online Course', description: 'Complete online course modules', category: 'learning', difficulty: 'medium', frequency: 'weekly' },
  { title: 'Practice Coding', description: 'Code for 1 hour daily', category: 'learning', difficulty: 'hard', frequency: 'daily' },
  
  // Productivity
  { title: 'Plan Tomorrow', description: 'Write down tasks for next day', category: 'productivity', difficulty: 'easy', frequency: 'daily' },
  { title: 'Review Daily Goals', description: 'Check progress on daily objectives', category: 'productivity', difficulty: 'easy', frequency: 'daily' },
  { title: 'Clean Workspace', description: 'Organize desk and work area', category: 'productivity', difficulty: 'easy', frequency: 'daily' },
  { title: 'Time Blocking', description: 'Schedule tasks in time blocks', category: 'productivity', difficulty: 'medium', frequency: 'daily' },
  
  // Wellness & Mental Health
  { title: 'Meditation', description: '10 minutes of mindfulness', category: 'wellness', difficulty: 'easy', frequency: 'daily' },
  { title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for', category: 'wellness', difficulty: 'easy', frequency: 'daily' },
  { title: 'Deep Breathing', description: '5 minutes of breathing exercises', category: 'wellness', difficulty: 'easy', frequency: 'daily' },
  { title: 'Digital Detox', description: 'No phone for 1 hour before bed', category: 'wellness', difficulty: 'medium', frequency: 'daily' },
  
  // Creative & Social
  { title: 'Creative Writing', description: 'Write for 20 minutes', category: 'creative', difficulty: 'medium', frequency: 'daily' },
  { title: 'Call Family', description: 'Connect with family members', category: 'social', difficulty: 'easy', frequency: 'weekly' },
  { title: 'Practice Kindness', description: 'Do something kind for someone', category: 'social', difficulty: 'easy', frequency: 'daily' },
  
  // Finance & Career
  { title: 'Track Expenses', description: 'Record daily spending', category: 'finance', difficulty: 'easy', frequency: 'daily' },
  { title: 'Skill Development', description: 'Work on professional skills', category: 'career', difficulty: 'medium', frequency: 'daily' }
];

// User profiles with different characteristics for better matching
const userProfiles = {
  'siddhartha@mail.com': {
    preferences: ['health', 'productivity', 'learning'],
    level: 4,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 6
  },
  'sandesh@mail.com': {
    preferences: ['health', 'wellness', 'productivity'],
    level: 3,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 5
  },
  'sujan@mail.com': {
    preferences: ['learning', 'creative', 'wellness'],
    level: 2,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 4
  },
  'vinish@mail.com': {
    preferences: ['health', 'career', 'productivity'],
    level: 5,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 7
  },
  'kiran@mail.com': {
    preferences: ['wellness', 'social', 'creative'],
    level: 3,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 5
  },
  'bipin@mail.com': {
    preferences: ['health', 'learning', 'finance'],
    level: 4,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 6
  },
  'anupam@mail.com': {
    preferences: ['productivity', 'career', 'learning'],
    level: 6,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 8
  },
  'shudamshu@mail.com': {
    preferences: ['wellness', 'creative', 'social'],
    level: 2,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 4
  },
  'sonam@mail.com': {
    preferences: ['health', 'wellness', 'social'],
    level: 3,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 5
  }
};

const registerNewUsers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('👥 Starting new user registration...');
    
    const registeredUsers = [];
    const skippedUsers = [];
    let habitsCreated = 0;

    for (const userData of newUsers) {
      try {
        // Generate username from full name
        const username = generateUsername(userData.fullName);

        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { email: userData.email },
            { username: username }
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

        // Get user profile
        const profile = userProfiles[userData.email];
        const xpForLevel = profile.level * 200 + Math.floor(Math.random() * 100);
        const completedHabits = profile.level * 15 + Math.floor(Math.random() * 20);
        const currentStreak = Math.floor(Math.random() * 15) + 1;
        const longestStreak = currentStreak + Math.floor(Math.random() * 10);

        // Create new user
        const newUser = new User({
          username: username,
          email: userData.email,
          password: hashedPassword,
          role: 'user',
          isActive: true,
          timezone: profile.timezone,
          goals: profile.preferences,
          level: profile.level,
          stats: {
            totalHabitsCompleted: completedHabits,
            currentStreak: currentStreak,
            longestStreak: longestStreak,
            totalXpEarned: xpForLevel,
            totalCoinsEarned: 100 + (profile.level * 50) + Math.floor(Math.random() * 200)
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
          username: username,
          id: newUser._id,
          level: profile.level
        });

        // Create sample habits for the user
        await createSampleHabitsForUser(newUser._id, userData.fullName, profile);
        habitsCreated += profile.habitCount;

      } catch (error) {
        console.error(`❌ Error registering ${userData.fullName}:`, error.message);
      }
    }

    // Summary
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registeredUsers.length} users`);
    console.log(`⚠️  Skipped (already exist): ${skippedUsers.length} users`);
    console.log(`🎯 Habits created: ${habitsCreated} habits`);
    console.log(`📈 Average habits per user: ${(habitsCreated / registeredUsers.length).toFixed(1)}`);

    if (registeredUsers.length > 0) {
      console.log('\n👥 Newly Registered Users:');
      registeredUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.username}) - Level ${user.level} - ${user.email}`);
      });
    }

    if (skippedUsers.length > 0) {
      console.log('\n⚠️  Skipped Users (Already Exist):');
      skippedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName} - ${user.email}`);
      });
    }

    console.log('\n🎮 Ready for Partner Matching!');
    console.log('Users now have varied levels, habits, and stats for realistic partner discovery.');

  } catch (error) {
    console.error('❌ Error in user registration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

const createSampleHabitsForUser = async (userId, userName, profile) => {
  try {
    // Get habits matching user preferences
    const preferredHabits = habitTemplates.filter(habit => 
      profile.preferences.includes(habit.category)
    );
    
    // Add some random habits from other categories for variety
    const otherHabits = habitTemplates.filter(habit => 
      !profile.preferences.includes(habit.category)
    );
    
    // Select habits: mostly from preferences, some random
    const selectedHabits = [
      ...preferredHabits.sort(() => Math.random() - 0.5).slice(0, Math.floor(profile.habitCount * 0.7)),
      ...otherHabits.sort(() => Math.random() - 0.5).slice(0, Math.ceil(profile.habitCount * 0.3))
    ].slice(0, profile.habitCount);

    for (const habitTemplate of selectedHabits) {
      const habit = new Habit({
        ...habitTemplate,
        userId: userId,
        isActive: true,
        streak: Math.floor(Math.random() * 10) + 1,
        completionHistory: generateRandomCompletionHistory(profile.activityLevel),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
      });

      await habit.save();
    }

    console.log(`   ✅ Created ${selectedHabits.length} habits for ${userName}`);
  } catch (error) {
    console.error(`   ❌ Error creating habits for ${userName}:`, error.message);
  }
};

const generateRandomCompletionHistory = (activityLevel) => {
  const history = [];
  const today = new Date();
  const daysToGenerate = 30;
  
  // Activity level affects completion rate
  const completionRate = {
    'high': 0.85,
    'medium': 0.65,
    'low': 0.45
  }[activityLevel] || 0.65;

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    if (Math.random() < completionRate) {
      history.push({
        date: date,
        completed: true,
        xpEarned: 10 + Math.floor(Math.random() * 15)
      });
    }
  }
  
  return history;
};

// Run if called directly
if (require.main === module) {
  registerNewUsers();
}

module.exports = registerNewUsers;
