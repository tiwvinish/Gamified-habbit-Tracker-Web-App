const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const PairBadgeDefinition = require('../models/PairBadge');

const initializePairBadges = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🏆 Initializing pair badges...');
    await PairBadgeDefinition.initializeDefaultBadges();
    
    console.log('✅ Pair badges initialization complete!');
    
    // Display all badges
    const badges = await PairBadgeDefinition.find({});
    console.log(`📋 Total badges available: ${badges.length}`);
    
    badges.forEach(badge => {
      console.log(`${badge.icon} ${badge.name} (${badge.rarity}) - ${badge.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing pair badges:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  initializePairBadges();
}

module.exports = initializePairBadges;
