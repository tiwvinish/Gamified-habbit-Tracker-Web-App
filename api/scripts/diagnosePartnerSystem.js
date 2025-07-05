const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Habit = require('../models/Habit');
const AccountabilityPartner = require('../models/AccountabilityPartner');

const diagnosePartnerSystem = async () => {
  try {
    console.log('🔍 Diagnosing Partner System...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check total users
    const totalUsers = await User.countDocuments();
    console.log(`👥 Total users in database: ${totalUsers}`);

    // 2. Check active users
    const activeUsers = await User.countDocuments({ isActive: true });
    console.log(`🟢 Active users: ${activeUsers}`);

    // 3. Check users with habits
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
        $count: 'usersWithHabits'
      }
    ]);

    const usersWithHabitsCount = usersWithHabits[0]?.usersWithHabits || 0;
    console.log(`📋 Users with active habits: ${usersWithHabitsCount}`);

    // 4. Check total habits
    const totalHabits = await Habit.countDocuments();
    console.log(`📝 Total habits: ${totalHabits}`);

    const activeHabits = await Habit.countDocuments({ isActive: true });
    console.log(`✅ Active habits: ${activeHabits}`);

    // 5. Check existing partnerships
    const totalPartnerships = await AccountabilityPartner.countDocuments();
    console.log(`🤝 Total partnerships: ${totalPartnerships}`);

    // 6. Sample user analysis
    console.log('\n📊 Sample User Analysis:');
    const sampleUsers = await User.find({ isActive: true }).limit(5);
    
    for (const user of sampleUsers) {
      const userHabits = await Habit.find({ userId: user._id, isActive: true });
      console.log(`- ${user.username || user.email}: ${userHabits.length} habits`);
      
      if (userHabits.length > 0) {
        const categories = [...new Set(userHabits.map(h => h.category))];
        console.log(`  Categories: ${categories.join(', ')}`);
      }
    }

    // 7. Test partner matching for a user with habits
    console.log('\n🔍 Testing Partner Matching:');
    const userWithHabits = await User.findOne({
      isActive: true
    });

    if (userWithHabits) {
      const userHabits = await Habit.find({ userId: userWithHabits._id, isActive: true });
      console.log(`Testing for user: ${userWithHabits.username || userWithHabits.email} (${userHabits.length} habits)`);

      if (userHabits.length > 0) {
        // Import and test the matching algorithm
        const { findAccountabilityPartners } = require('../algorithms/partnerMatching');
        
        try {
          const partners = await findAccountabilityPartners(userWithHabits._id, 5);
          console.log(`✅ Found ${partners.length} potential partners`);
          
          partners.forEach((partner, index) => {
            console.log(`${index + 1}. ${partner.user.username || partner.user.email} - Score: ${partner.matchScore.toFixed(1)}%`);
          });
        } catch (error) {
          console.log(`❌ Partner matching failed: ${error.message}`);
        }
      } else {
        console.log('❌ Test user has no habits');
      }
    } else {
      console.log('❌ No active users found');
    }

    // 8. Check for common issues
    console.log('\n🔧 Common Issues Check:');
    
    // Check if users have stats
    const usersWithStats = await User.countDocuments({ 'stats.totalHabitsCompleted': { $exists: true } });
    console.log(`📈 Users with stats: ${usersWithStats}`);

    // Check if users have timezone
    const usersWithTimezone = await User.countDocuments({ timezone: { $exists: true, $ne: null } });
    console.log(`🌍 Users with timezone: ${usersWithTimezone}`);

    // Check if users have goals
    const usersWithGoals = await User.countDocuments({ goals: { $exists: true, $ne: [] } });
    console.log(`🎯 Users with goals: ${usersWithGoals}`);

    console.log('\n💡 Recommendations:');
    if (usersWithHabitsCount < 2) {
      console.log('❗ Need at least 2 users with habits for partner matching');
      console.log('   Run the user registration script to add more users with habits');
    }
    
    if (usersWithStats < activeUsers) {
      console.log('❗ Some users missing stats - this affects matching quality');
    }
    
    if (usersWithTimezone < activeUsers) {
      console.log('❗ Some users missing timezone - this affects compatibility scoring');
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the diagnosis
diagnosePartnerSystem().catch(console.error);
