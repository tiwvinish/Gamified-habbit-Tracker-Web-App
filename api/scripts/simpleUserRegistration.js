// Simple user registration script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string - update this with your actual connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/habit-tracker';

// User schema (simplified)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  timezone: { type: String, default: 'UTC' },
  goals: [String],
  level: { type: Number, default: 1 },
  stats: {
    totalHabitsCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },
    totalCoinsEarned: { type: Number, default: 100 }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      habitReminders: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: { type: String, default: 'public' },
      showStats: { type: Boolean, default: true },
      allowPartnerRequests: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const testUsers = [
  { username: 'sandesh_gautam', email: 'sandesh@mail.com', password: 'sandesh@123', fullName: 'Sandesh Gautam' },
  { username: 'pratik_shrestha', email: 'pratik@mail.com', password: 'pratik@123', fullName: 'Pratik Shrestha' },
  { username: 'sujan_karki', email: 'sujan@mail.com', password: 'sujan@123', fullName: 'Sujan Karki' },
  { username: 'anisha_thapa', email: 'anisha@mail.com', password: 'anisha@123', fullName: 'Anisha Thapa' },
  { username: 'sagar_bhandari', email: 'sagar@mail.com', password: 'sagar@123', fullName: 'Sagar Bhandari' },
  { username: 'nirajan_acharya', email: 'nirajan@mail.com', password: 'nirajan@123', fullName: 'Nirajan Acharya' },
  { username: 'sita_tamang', email: 'sita@mail.com', password: 'sita@123', fullName: 'Sita Tamang' },
  { username: 'ramesh_neupane', email: 'ramesh@mail.com', password: 'ramesh@123', fullName: 'Ramesh Neupane' },
  { username: 'kabita_maharjan', email: 'kabita@mail.com', password: 'kabita@123', fullName: 'Kabita Maharjan' },
  { username: 'dipesh_basnet', email: 'dipesh@mail.com', password: 'dipesh@123', fullName: 'Dipesh Basnet' },
  { username: 'sarita_rai', email: 'sarita@mail.com', password: 'sarita@123', fullName: 'Sarita Rai' },
  { username: 'bikash_poudel', email: 'bikash@mail.com', password: 'bikash@123', fullName: 'Bikash Poudel' }
];

async function registerUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('👥 Starting user registration...');
    
    let registered = 0;
    let skipped = 0;
    let errors = 0;

    for (const userData of testUsers) {
      try {
        // Check if user exists
        const existingUser = await User.findOne({
          $or: [{ email: userData.email }, { username: userData.username }]
        });

        if (existingUser) {
          console.log(`⚠️  ${userData.fullName} already exists - skipping`);
          skipped++;
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
          role: 'user',
          isActive: true,
          timezone: 'UTC',
          goals: ['health', 'productivity', 'wellness'],
          level: 1,
          stats: {
            totalHabitsCompleted: Math.floor(Math.random() * 50),
            currentStreak: Math.floor(Math.random() * 10),
            longestStreak: Math.floor(Math.random() * 20),
            totalXpEarned: Math.floor(Math.random() * 1000),
            totalCoinsEarned: 100 + Math.floor(Math.random() * 500)
          }
        });

        await newUser.save();
        console.log(`✅ Registered: ${userData.fullName} (${userData.email})`);
        registered++;

      } catch (error) {
        console.error(`❌ Error registering ${userData.fullName}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registered} users`);
    console.log(`⚠️  Skipped (already exist): ${skipped} users`);
    console.log(`❌ Failed: ${errors} users`);
    console.log(`📝 Total processed: ${testUsers.length} users`);

    // List all registered users
    console.log('\n👥 All Users in Database:');
    const allUsers = await User.find({}).select('username email level stats.totalXpEarned createdAt');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Level ${user.level} - ${user.stats.totalXpEarned} XP`);
    });

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the registration
registerUsers().catch(console.error);
