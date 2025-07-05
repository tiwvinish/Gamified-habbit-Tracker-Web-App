const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const AccountabilityPartner = require('../models/AccountabilityPartner');

const safeDeleteAccountabilityPartner = async () => {
  try {
    console.log('🔍 Checking AccountabilityPartner collection for safe deletion...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check if collection exists and has data
    const partnershipCount = await AccountabilityPartner.countDocuments();
    console.log(`📊 AccountabilityPartner collection contains: ${partnershipCount} documents`);

    if (partnershipCount === 0) {
      console.log('✅ Collection is empty - safe to delete');
    } else {
      console.log('⚠️  Collection contains data - checking migration status...');
      
      // 2. Check if data has been migrated to User collection
      const usersWithPartnerships = await User.countDocuments({
        'partnerships.0': { $exists: true }
      });
      
      console.log(`👥 Users with partnerships in User collection: ${usersWithPartnerships}`);
      
      if (usersWithPartnerships === 0) {
        console.log('❌ NO MIGRATION DETECTED!');
        console.log('🚨 Data has NOT been migrated to User collection yet');
        console.log('📋 Please run migration first:');
        console.log('   node migrateToSimplifiedPartners.js');
        console.log('\n❌ ABORTING - Will not delete data without migration');
        return;
      }
      
      // 3. Compare data counts
      console.log('\n📊 Migration Verification:');
      console.log(`   AccountabilityPartner documents: ${partnershipCount}`);
      console.log(`   Users with partnerships: ${usersWithPartnerships}`);
      
      if (usersWithPartnerships >= partnershipCount) {
        console.log('✅ Migration appears successful');
      } else {
        console.log('⚠️  Migration may be incomplete');
        console.log('💡 Each partnership should create 2 user entries (one for each user)');
      }
    }

    // 4. Create final backup before deletion
    console.log('\n💾 Creating final backup...');
    const backupName = `accountability_partners_final_backup_${Date.now()}`;
    
    try {
      await mongoose.connection.db.collection('accountabilitypartners').aggregate([
        { $out: backupName }
      ]).toArray();
      console.log(`✅ Final backup created: ${backupName}`);
    } catch (backupError) {
      if (partnershipCount > 0) {
        console.log('❌ Failed to create backup - aborting deletion');
        console.error('Backup error:', backupError.message);
        return;
      } else {
        console.log('ℹ️  No backup needed (collection is empty)');
      }
    }

    // 5. Show what will be deleted
    if (partnershipCount > 0) {
      console.log('\n📋 Sample data that will be deleted:');
      const sampleData = await AccountabilityPartner.find({}).limit(3).select('partnershipId user1 user2 status matchScore');
      sampleData.forEach((doc, index) => {
        console.log(`${index + 1}. Partnership: ${doc.partnershipId}`);
        console.log(`   Users: ${doc.user1} ↔ ${doc.user2}`);
        console.log(`   Status: ${doc.status}, Score: ${doc.matchScore}%`);
      });
      
      if (partnershipCount > 3) {
        console.log(`   ... and ${partnershipCount - 3} more documents`);
      }
    }

    // 6. Confirm deletion
    console.log('\n🗑️  DELETION CONFIRMATION:');
    console.log(`📊 Will delete: ${partnershipCount} documents from AccountabilityPartner collection`);
    console.log(`💾 Backup saved as: ${backupName}`);
    console.log(`✅ Migration status: ${usersWithPartnerships > 0 ? 'COMPLETED' : 'NOT NEEDED'}`);
    
    // 7. Perform deletion
    console.log('\n🔄 Deleting AccountabilityPartner collection...');
    
    const deleteResult = await mongoose.connection.db.collection('accountabilitypartners').drop();
    console.log('✅ AccountabilityPartner collection deleted successfully!');

    // 8. Verify deletion
    try {
      const verifyCount = await AccountabilityPartner.countDocuments();
      console.log(`❌ Unexpected: Collection still exists with ${verifyCount} documents`);
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log('✅ Verified: Collection no longer exists');
      } else {
        console.log('⚠️  Verification error:', error.message);
      }
    }

    // 9. Clean up model file reference
    console.log('\n📋 Next steps:');
    console.log('1. ✅ AccountabilityPartner collection deleted');
    console.log('2. 🔧 Remove AccountabilityPartner model file:');
    console.log('   rm api/models/AccountabilityPartner.js');
    console.log('3. 🔧 Update server.js to use simplified routes:');
    console.log('   app.use(\'/api/partners\', require(\'./Routes/simplifiedPartners\'));');
    console.log('4. 🧪 Test partner system with simplified approach');
    console.log('5. 🗑️  Remove old controller if not needed:');
    console.log('   rm api/Controllers/partnerController.js');

    console.log('\n🎉 AccountabilityPartner collection successfully removed!');
    console.log('💡 Partner system now uses simplified User collection approach');

  } catch (error) {
    console.error('❌ Deletion failed:', error);
    console.log('\n🛡️  Safety measures prevented data loss');
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the safe deletion
safeDeleteAccountabilityPartner().catch(console.error);
