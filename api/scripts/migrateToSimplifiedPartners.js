const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const AccountabilityPartner = require('../models/AccountabilityPartner');

const migrateToSimplifiedPartners = async () => {
  try {
    console.log('🔄 Migrating to simplified partner system...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check existing data
    const existingPartnerships = await AccountabilityPartner.countDocuments();
    console.log(`📊 Found ${existingPartnerships} existing partnerships in AccountabilityPartner collection`);

    if (existingPartnerships === 0) {
      console.log('✅ No existing partnerships to migrate');
      console.log('🎉 Migration completed - using simplified system');
      return;
    }

    // 2. Migrate existing partnerships
    console.log('\n🔄 Migrating existing partnerships...');
    
    const partnerships = await AccountabilityPartner.find({});
    let migratedCount = 0;

    for (const partnership of partnerships) {
      try {
        const user1Id = partnership.user1;
        const user2Id = partnership.user2;

        // Add partnership to user1
        await User.findByIdAndUpdate(user1Id, {
          $addToSet: {
            partnerships: {
              partnerId: user2Id,
              status: partnership.status,
              matchScore: partnership.matchScore,
              createdAt: partnership.createdAt,
              acceptedAt: partnership.acceptedAt,
              endedAt: partnership.endedAt
            }
          }
        });

        // Add partnership to user2
        await User.findByIdAndUpdate(user2Id, {
          $addToSet: {
            partnerships: {
              partnerId: user1Id,
              status: partnership.status,
              matchScore: partnership.matchScore,
              createdAt: partnership.createdAt,
              acceptedAt: partnership.acceptedAt,
              endedAt: partnership.endedAt
            }
          }
        });

        migratedCount++;
        console.log(`✅ Migrated partnership ${partnership.partnershipId}`);

      } catch (error) {
        console.error(`❌ Error migrating partnership ${partnership.partnershipId}:`, error.message);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} partnerships`);
    console.log(`❌ Failed to migrate: ${existingPartnerships - migratedCount} partnerships`);

    // 3. Verify migration
    console.log('\n🔍 Verifying migration...');
    
    const usersWithPartnerships = await User.countDocuments({
      'partnerships.0': { $exists: true }
    });
    
    console.log(`👥 Users with partnerships after migration: ${usersWithPartnerships}`);

    // 4. Optional: Backup and remove old collection
    console.log('\n💾 Creating backup of old collection...');
    
    // Create backup collection
    const backupCollectionName = `accountability_partners_backup_${Date.now()}`;
    await mongoose.connection.db.collection('accountabilitypartners').aggregate([
      { $out: backupCollectionName }
    ]).toArray();
    
    console.log(`✅ Backup created: ${backupCollectionName}`);

    // Ask user if they want to remove old collection
    console.log('\n⚠️  Old AccountabilityPartner collection is still present');
    console.log('💡 You can manually remove it after verifying the migration worked correctly');
    console.log('   To remove: db.accountabilitypartners.drop()');

    console.log('\n🎉 Migration to simplified partner system completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Update server.js to use simplified routes');
    console.log('2. Test the partner system');
    console.log('3. Remove old collection if everything works');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the migration
migrateToSimplifiedPartners().catch(console.error);
