const express = require('express');
const router = express.Router();
const auth = require('../Middleware/authMiddleware');
const {
  findPotentialPartners,
  sendPartnerRequest,
  acceptPartnerRequest,
  acceptPartnerRequestByPartnerId,
  declinePartnerRequest,
  declinePartnerRequestByPartnerId,
  getUserPartnerships,
  endPartnership,
  sendMotivationMessage,
  sendPartnerChallenge,
  getPartnerChallenges
} = require('../Controllers/simplifiedPartnerController');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 PARTNER TEST ROUTE HIT!');
  res.json({ message: 'Partner route is working!' });
});

// Create a test partnership notification (for debugging)
router.post('/create-test-partnership-notification', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');

    console.log('🧪 Creating test partnership notification for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a test partnership notification
    const testNotification = {
      type: 'partnership',
      from: userId,
      fromUsername: 'Test Partner User',
      message: 'Test partnership request - wants to be your accountability partner!',
      read: false,
      createdAt: new Date(),
      metadata: {
        requestType: 'partnership',
        senderId: userId,
        senderUsername: 'Test Partner User'
      }
    };

    const result = await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: testNotification
      }
    }, { new: true });

    console.log('✅ Test partnership notification created');
    console.log('📊 User now has', result.notifications?.length || 0, 'total notifications');

    res.json({
      success: true,
      message: 'Test partnership notification created successfully',
      notification: testNotification,
      totalNotifications: result.notifications?.length || 0
    });

  } catch (error) {
    console.error('❌ Error creating test partnership notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
});



// Simple test endpoint with auth
router.get('/test-auth', auth, (req, res) => {
  console.log('🔐 AUTH TEST ROUTE HIT!');
  console.log('User ID:', req.user?.id);
  res.json({
    message: 'Auth test working!',
    userId: req.user?.id,
    userEmail: req.user?.email
  });
});

// Direct test endpoint for find
router.get('/find-direct', auth, (req, res) => {
  console.log('🎯 DIRECT FIND ROUTE HIT!');
  console.log('User ID:', req.user?.id);
  res.json({
    success: true,
    partners: [
      {
        user: {
          id: 'direct123',
          username: 'Direct Test User',
          email: 'direct@test.com',
          level: 1,
          timezone: 'UTC',
          stats: {}
        },
        matchScore: 88.5,
        matchingCriteria: {},
        commonHabits: [],
        habitCount: 3,
        commonCategories: []
      }
    ],
    total: 1,
    message: 'Direct route working! Found 1 partner'
  });
});

// Find potential accountability partners - direct implementation
router.get('/find', auth, async (req, res) => {
  try {
    console.log('🤝 DISCOVER PARTNERS ENDPOINT HIT!');
    const userId = req.user?.id;
    console.log('User ID:', userId);

    const User = require('../models/User');
    const mongoose = require('mongoose');

    // Convert userId to ObjectId if it's a string
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    // Get random users excluding the logged-in user
    const randomUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userObjectId },
          isActive: true
        }
      },
      { $sample: { size: 8 } }
    ]);

    console.log(`📊 Found ${randomUsers.length} potential partners`);

    if (randomUsers.length === 0) {
      console.log('⚠️ No users found for partner discovery');
      return res.json({
        success: true,
        partners: [],
        total: 0,
        message: 'No potential partners found'
      });
    }

    // Create partner objects with complete data
    const partners = randomUsers.map(user => ({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        level: user.level || 1,
        points: user.points || 0,
        timezone: user.timezone || 'UTC',
        stats: user.stats || {
          totalHabitsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalXpEarned: 0
        }
      },
      matchScore: Math.round((Math.random() * 40 + 50) * 10) / 10, // 50-90% match
      matchingCriteria: {
        habitSimilarity: Math.round(Math.random() * 100),
        timezoneCompatibility: Math.round(Math.random() * 50 + 50), // 50-100%
        activityLevel: Math.round(Math.random() * 100),
        goalAlignment: Math.round(Math.random() * 100)
      },
      commonHabits: ['Exercise', 'Reading', 'Meditation'],
      habitCount: Math.floor(Math.random() * 8) + 2, // 2-10 habits
      commonCategories: ['Health', 'Productivity', 'Learning']
    }));

    console.log(`✅ Returning ${partners.length} potential partners`);
    console.log('Partner usernames:', partners.map(p => p.user.username));

    res.json({
      success: true,
      partners: partners,
      total: partners.length,
      message: `Found ${partners.length} potential accountability partners`
    });

  } catch (error) {
    console.error('❌ Partner discovery error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding partners',
      error: error.message
    });
  }
});

// Send partnership request
router.post('/request', auth, sendPartnerRequest);

// Test partnership request endpoint (for debugging)
router.post('/test-request', auth, async (req, res) => {
  try {
    console.log('🧪 TEST PARTNERSHIP REQUEST:', {
      userId: req.user.id,
      body: req.body,
      headers: req.headers.authorization ? 'Present' : 'Missing'
    });

    const { partnerId, message } = req.body;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID is required for test request'
      });
    }

    const User = require('../models/User');

    // Check if both users exist
    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(partnerId);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender user not found'
      });
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver user not found'
      });
    }

    console.log('✅ TEST: Both users found:', {
      sender: sender.username,
      receiver: receiver.username
    });

    res.json({
      success: true,
      message: 'Test partnership request validation passed',
      sender: { id: sender._id, username: sender.username },
      receiver: { id: receiver._id, username: receiver.username },
      canProceed: true
    });

  } catch (error) {
    console.error('❌ TEST PARTNERSHIP REQUEST ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Test partnership request failed',
      error: error.message
    });
  }
});

// Accept partnership request
router.post('/:partnershipId/accept', auth, acceptPartnerRequest);
router.post('/request/:requestId/accept', auth, acceptPartnerRequest);

// Accept/Decline partnership request by partner ID (for activities section)
router.post('/accept/:partnerId', auth, acceptPartnerRequestByPartnerId);
router.post('/decline/:partnerId', auth, declinePartnerRequestByPartnerId);

// Decline/Cancel partnership request
router.delete('/request/:requestId', auth, declinePartnerRequest);

// Get user's partnerships
router.get('/my-partnerships', auth, getUserPartnerships);

// End partnership
router.delete('/:partnershipId', auth, endPartnership);

// Send motivation message
router.post('/motivation', auth, sendMotivationMessage);

// Send challenge
router.post('/challenge', auth, sendPartnerChallenge);

// Get available challenges for partner challenges
router.get('/challenges', auth, getPartnerChallenges);

// Accept challenge from partner
router.post('/challenge/accept', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId, challengeId, challengeTitle } = req.body;

    console.log('✅ Challenge acceptance:', {
      userId,
      partnerId,
      challengeTitle
    });

    // Here you could create a challenge record or update user progress
    // For now, we'll just send a confirmation notification back to the sender

    const User = require('../models/User');
    const acceptingUser = await User.findById(userId).select('username');

    // Send confirmation notification to the challenge sender
    await User.findByIdAndUpdate(partnerId, {
      $push: {
        notifications: {
          type: 'challenge',
          from: userId,
          fromUsername: acceptingUser.username,
          message: `${acceptingUser.username} accepted your challenge: ${challengeTitle}`,
          read: false,
          createdAt: new Date(),
          metadata: {
            challengeTitle: challengeTitle,
            messageType: 'challenge_accepted',
            senderId: userId,
            senderUsername: acceptingUser.username,
            emoji: '🎯'
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Challenge accepted successfully'
    });

  } catch (error) {
    console.error('❌ Error accepting challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept challenge',
      error: error.message
    });
  }
});

// Decline challenge from partner
router.post('/challenge/decline', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.body;

    console.log('❌ Challenge declined:', {
      userId,
      partnerId
    });

    const User = require('../models/User');
    const decliningUser = await User.findById(userId).select('username');

    // Send notification to the challenge sender
    await User.findByIdAndUpdate(partnerId, {
      $push: {
        notifications: {
          type: 'challenge',
          from: userId,
          fromUsername: decliningUser.username,
          message: `${decliningUser.username} declined your challenge`,
          read: false,
          createdAt: new Date(),
          metadata: {
            messageType: 'challenge_declined',
            senderId: userId,
            senderUsername: decliningUser.username,
            emoji: '❌'
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Challenge declined'
    });

  } catch (error) {
    console.error('❌ Error declining challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline challenge',
      error: error.message
    });
  }
});





// Get partner notifications (partnership requests, motivation, challenges)
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');

    console.log('🔔 Fetching notifications for user:', userId);

    const user = await User.findById(userId).select('notifications username email');
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('👤 Fetching notifications for:', user.username, '(', user.email, ')');
    console.log('📋 Total notifications in database:', user.notifications?.length || 0);

    // Log all notifications for debugging
    if (user.notifications && user.notifications.length > 0) {
      console.log('📝 All notifications:');
      user.notifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. Type: "${notif.type}", From: "${notif.fromUsername}", Read: ${notif.read}, Created: ${notif.createdAt}`);
        console.log(`      Message: "${notif.message?.substring(0, 100)}..."`);
        if (notif.type === 'partnership') {
          console.log(`      🤝 Partnership request from: ${notif.fromUsername} (ID: ${notif.from})`);
        }
      });
    } else {
      console.log('📝 No notifications found in database');
    }

    // Filter for partner-related notifications only
    const partnerNotifications = (user.notifications || []).filter(notification => {
      const isPartnerType = ['partnership', 'motivation', 'challenge'].includes(notification.type);
      if (isPartnerType) {
        console.log(`✅ Including ${notification.type} notification from ${notification.fromUsername}`);
      }
      return isPartnerType;
    });

    console.log('🎯 Partner notifications found:', partnerNotifications.length);

    // Sort by creation date (newest first)
    const sortedNotifications = partnerNotifications.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Log what we're returning
    console.log('📤 Returning notifications:');
    sortedNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.type} from ${notif.fromUsername}: ${notif.message?.substring(0, 50)}...`);
    });

    console.log(`✅ Returning ${sortedNotifications.length} partner notifications for user ${userId}`);

    res.json({
      success: true,
      notifications: sortedNotifications,
      totalNotifications: user.notifications?.length || 0,
      partnerNotificationCount: sortedNotifications.length
    });

  } catch (error) {
    console.error('❌ Error fetching partner notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});





// Test notification system end-to-end
router.post('/test-notification-system', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');

    console.log('🧪 Testing notification system for user:', userId);

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('👤 Testing for user:', user.username);
    console.log('📋 Current notifications count:', user.notifications?.length || 0);

    // Create a test notification directly
    const testNotification = {
      type: 'partnership',
      from: userId,
      fromUsername: 'Test Partner System',
      message: 'This is a test partnership request to verify the notification system works!',
      read: false,
      createdAt: new Date(),
      metadata: {
        requestType: 'partnership',
        senderId: userId,
        senderUsername: 'Test Partner System'
      }
    };

    console.log('📝 Creating test notification:', testNotification);

    // Add notification to user
    const updateResult = await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: testNotification
      }
    }, { new: true });

    if (!updateResult) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create test notification'
      });
    }

    console.log('✅ Test notification created');
    console.log('📊 User now has', updateResult.notifications?.length || 0, 'total notifications');

    // Now retrieve notifications to verify
    const userWithNotifications = await User.findById(userId).select('notifications');
    const partnerNotifications = (userWithNotifications.notifications || []).filter(notification =>
      ['partnership', 'motivation', 'challenge'].includes(notification.type)
    );

    console.log('🔍 Retrieved partner notifications:', partnerNotifications.length);

    res.json({
      success: true,
      message: 'Notification system test completed',
      testNotificationCreated: true,
      totalNotifications: updateResult.notifications?.length || 0,
      partnerNotifications: partnerNotifications.length,
      latestNotification: updateResult.notifications[updateResult.notifications.length - 1]
    });

  } catch (error) {
    console.error('❌ Error testing notification system:', error);
    res.status(500).json({
      success: false,
      message: 'Notification system test failed',
      error: error.message
    });
  }
});

// Create comprehensive test notifications for all types
router.post('/create-all-test-notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');

    console.log('🧪 Creating comprehensive test notifications for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create test notifications for all three types
    const testNotifications = [
      {
        type: 'partnership',
        from: userId,
        fromUsername: 'Test Partner',
        message: 'Test Partner wants to be your accountability partner!',
        read: false,
        createdAt: new Date(),
        metadata: {
          requestType: 'partnership',
          senderId: userId,
          senderUsername: 'Test Partner'
        }
      },
      {
        type: 'motivation',
        from: userId,
        fromUsername: 'Motivational Friend',
        message: 'You are doing amazing! Keep pushing forward! 💪',
        read: false,
        createdAt: new Date(),
        metadata: {
          messageType: 'motivation',
          senderId: userId,
          senderUsername: 'Motivational Friend',
          emoji: '💪'
        }
      },
      {
        type: 'challenge',
        from: userId,
        fromUsername: 'Challenge Master',
        message: 'Challenge Master has challenged you: Complete 30 minutes of exercise daily',
        read: false,
        createdAt: new Date(),
        metadata: {
          challengeTitle: 'Complete 30 minutes of exercise daily',
          challengeDescription: 'Stay active and healthy with daily exercise',
          challengeType: 'fitness',
          duration: 24,
          emoji: '⚔️',
          reward: 'Partnership XP + Badge',
          senderId: userId,
          senderUsername: 'Challenge Master'
        }
      }
    ];

    // Add all test notifications
    const result = await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: { $each: testNotifications }
      }
    }, { new: true });

    console.log('✅ All test notifications created successfully');
    console.log('📊 User now has', result.notifications?.length || 0, 'total notifications');

    res.json({
      success: true,
      message: 'All test notifications created successfully',
      notificationsCreated: testNotifications.length,
      totalNotifications: result.notifications?.length || 0,
      notifications: testNotifications
    });

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notifications',
      error: error.message
    });
  }
});

module.exports = router;
