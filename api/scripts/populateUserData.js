const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Habit = require('../models/Habit');

// Comprehensive habit templates with categories
const habitTemplates = [
  // Health & Fitness
  { title: 'Morning Exercise', description: '30 minutes of physical activity', category: 'health', difficulty: 'medium', frequency: 'daily' },
  { title: 'Evening Walk', description: '20 minutes walk after dinner', category: 'health', difficulty: 'easy', frequency: 'daily' },
  { title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day', category: 'health', difficulty: 'easy', frequency: 'daily' },
  { title: 'Yoga Practice', description: '15 minutes of yoga or stretching', category: 'health', difficulty: 'medium', frequency: 'daily' },
  { title: 'Gym Workout', description: 'Strength training at the gym', category: 'health', difficulty: 'hard', frequency: 'weekly' },
  { title: 'Healthy Breakfast', description: 'Eat a nutritious breakfast', category: 'nutrition', difficulty: 'easy', frequency: 'daily' },
  { title: 'Take Vitamins', description: 'Daily vitamin supplements', category: 'health', difficulty: 'easy', frequency: 'daily' },
  
  // Learning & Development
  { title: 'Read for 30 minutes', description: 'Read books or educational content', category: 'learning', difficulty: 'easy', frequency: 'daily' },
  { title: 'Learn New Language', description: 'Practice language skills for 20 minutes', category: 'learning', difficulty: 'medium', frequency: 'daily' },
  { title: 'Online Course', description: 'Complete online course modules', category: 'learning', difficulty: 'medium', frequency: 'weekly' },
  { title: 'Practice Coding', description: 'Code for 1 hour daily', category: 'learning', difficulty: 'hard', frequency: 'daily' },
  { title: 'Watch Educational Videos', description: 'Learn from YouTube or courses', category: 'learning', difficulty: 'easy', frequency: 'daily' },
  
  // Productivity
  { title: 'Plan Tomorrow', description: 'Write down tasks for next day', category: 'productivity', difficulty: 'easy', frequency: 'daily' },
  { title: 'Review Daily Goals', description: 'Check progress on daily objectives', category: 'productivity', difficulty: 'easy', frequency: 'daily' },
  { title: 'Clean Workspace', description: 'Organize desk and work area', category: 'productivity', difficulty: 'easy', frequency: 'daily' },
  { title: 'Time Blocking', description: 'Schedule tasks in time blocks', category: 'productivity', difficulty: 'medium', frequency: 'daily' },
  { title: 'Weekly Review', description: 'Reflect on week\'s achievements', category: 'productivity', difficulty: 'medium', frequency: 'weekly' },
  
  // Wellness & Mental Health
  { title: 'Meditation', description: '10 minutes of mindfulness', category: 'wellness', difficulty: 'easy', frequency: 'daily' },
  { title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for', category: 'wellness', difficulty: 'easy', frequency: 'daily' },
  { title: 'Deep Breathing', description: '5 minutes of breathing exercises', category: 'wellness', difficulty: 'easy', frequency: 'daily' },
  { title: 'Digital Detox', description: 'No phone for 1 hour before bed', category: 'wellness', difficulty: 'medium', frequency: 'daily' },
  { title: 'Nature Time', description: 'Spend time outdoors', category: 'wellness', difficulty: 'easy', frequency: 'daily' },
  
  // Social & Relationships
  { title: 'Call Family', description: 'Connect with family members', category: 'social', difficulty: 'easy', frequency: 'weekly' },
  { title: 'Text Friends', description: 'Reach out to friends', category: 'social', difficulty: 'easy', frequency: 'daily' },
  { title: 'Practice Kindness', description: 'Do something kind for someone', category: 'social', difficulty: 'easy', frequency: 'daily' },
  
  // Creative & Hobbies
  { title: 'Creative Writing', description: 'Write for 20 minutes', category: 'creative', difficulty: 'medium', frequency: 'daily' },
  { title: 'Draw or Sketch', description: 'Practice artistic skills', category: 'creative', difficulty: 'medium', frequency: 'daily' },
  { title: 'Play Music', description: 'Practice musical instrument', category: 'creative', difficulty: 'medium', frequency: 'daily' },
  { title: 'Photography', description: 'Take creative photos', category: 'creative', difficulty: 'easy', frequency: 'weekly' },
  
  // Finance & Career
  { title: 'Track Expenses', description: 'Record daily spending', category: 'finance', difficulty: 'easy', frequency: 'daily' },
  { title: 'Save Money', description: 'Put aside money for savings', category: 'finance', difficulty: 'medium', frequency: 'daily' },
  { title: 'Network Building', description: 'Connect with professionals', category: 'career', difficulty: 'medium', frequency: 'weekly' },
  { title: 'Skill Development', description: 'Work on professional skills', category: 'career', difficulty: 'medium', frequency: 'daily' }
];

// User profiles with different characteristics for better matching
const userProfiles = {
  'sandesh@mail.com': {
    preferences: ['health', 'productivity', 'learning'],
    level: 3,
    timezone: 'UTC+5:45', // Nepal
    activityLevel: 'high',
    habitCount: 6
  },
  'pratik@mail.com': {
    preferences: ['learning', 'career', 'productivity'],
    level: 4,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 5
  },
  'sujan@mail.com': {
    preferences: ['health', 'wellness', 'creative'],
    level: 2,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 4
  },
  'anisha@mail.com': {
    preferences: ['wellness', 'social', 'creative'],
    level: 5,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 7
  },
  'sagar@mail.com': {
    preferences: ['health', 'finance', 'productivity'],
    level: 3,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 5
  },
  'nirajan@mail.com': {
    preferences: ['learning', 'wellness', 'career'],
    level: 6,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 8
  },
  'sita@mail.com': {
    preferences: ['wellness', 'health', 'social'],
    level: 2,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 4
  },
  'ramesh@mail.com': {
    preferences: ['productivity', 'finance', 'learning'],
    level: 4,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 6
  },
  'kabita@mail.com': {
    preferences: ['creative', 'wellness', 'social'],
    level: 3,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 5
  },
  'dipesh@mail.com': {
    preferences: ['health', 'career', 'productivity'],
    level: 5,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 7
  },
  'sarita@mail.com': {
    preferences: ['wellness', 'learning', 'creative'],
    level: 2,
    timezone: 'UTC+5:45',
    activityLevel: 'medium',
    habitCount: 4
  },
  'bikash@mail.com': {
    preferences: ['health', 'learning', 'productivity'],
    level: 4,
    timezone: 'UTC+5:45',
    activityLevel: 'high',
    habitCount: 6
  }
};

const populateUserData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('👥 Populating user data...');
    
    let usersUpdated = 0;
    let habitsCreated = 0;

    for (const [email, profile] of Object.entries(userProfiles)) {
      try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
          console.log(`⚠️  User ${email} not found - skipping`);
          continue;
        }

        console.log(`📝 Processing ${user.username}...`);

        // Update user profile
        const xpForLevel = profile.level * 200; // 200 XP per level
        const completedHabits = profile.level * 15 + Math.floor(Math.random() * 20);
        const currentStreak = Math.floor(Math.random() * 15) + 1;
        const longestStreak = currentStreak + Math.floor(Math.random() * 10);

        await User.findByIdAndUpdate(user._id, {
          level: profile.level,
          timezone: profile.timezone,
          goals: profile.preferences,
          'stats.totalHabitsCompleted': completedHabits,
          'stats.currentStreak': currentStreak,
          'stats.longestStreak': longestStreak,
          'stats.totalXpEarned': xpForLevel,
          'stats.totalCoinsEarned': 100 + (profile.level * 50) + Math.floor(Math.random() * 200)
        });

        // Delete existing habits for this user
        await Habit.deleteMany({ userId: user._id });

        // Create habits based on user preferences
        const userHabits = [];
        
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
            userId: user._id,
            isActive: true,
            streak: Math.floor(Math.random() * currentStreak),
            completionHistory: generateCompletionHistory(profile.activityLevel),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
          });

          await habit.save();
          habitsCreated++;
        }

        console.log(`   ✅ Updated ${user.username} - Level ${profile.level}, ${selectedHabits.length} habits`);
        usersUpdated++;

      } catch (error) {
        console.error(`   ❌ Error processing user ${email}:`, error.message);
      }
    }

    console.log('\n📊 Population Summary:');
    console.log(`✅ Users updated: ${usersUpdated}`);
    console.log(`✅ Habits created: ${habitsCreated}`);
    console.log(`📈 Average habits per user: ${(habitsCreated / usersUpdated).toFixed(1)}`);

    // Display final user stats
    console.log('\n👥 Updated User Profiles:');
    const allUsers = await User.find({
      email: { $in: Object.keys(userProfiles) }
    }).select('username email level stats.totalXpEarned stats.currentStreak goals');

    allUsers.forEach((user, index) => {
      const profile = userProfiles[user.email];
      console.log(`${index + 1}. ${user.username} - Level ${user.level} - ${user.stats.totalXpEarned} XP - Streak: ${user.stats.currentStreak} - Goals: ${user.goals.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error populating user data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

const generateCompletionHistory = (activityLevel) => {
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
  populateUserData();
}

module.exports = populateUserData;
