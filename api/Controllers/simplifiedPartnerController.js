const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { findAccountabilityPartners } = require('../algorithms/partnerMatching');

// Find potential accountability partners (simplified)
const findPotentialPartners = async (req, res) => {
  try {
    console.log('🤝 SIMPLIFIED PARTNER CONTROLLER CALLED!');
    const userId = req.user.id;
    console.log('🔍 Finding partners for user:', userId);

    // Use existing algorithm but return simplified data
    const partners = await findAccountabilityPartners(userId, 10);
    console.log(`📊 Algorithm returned ${partners.length} partners`);

    // Filter partners with score >= 50 (lower threshold)
    const filteredPartners = partners.filter(p => p.matchScore >= 50);
    console.log(`✅ After filtering (score >= 50): ${filteredPartners.length} partners`);

    // Transform to format expected by frontend
    const simplifiedPartners = filteredPartners.map(partner => ({
      user: {
        id: partner.user._id,
        username: partner.user.username,
        email: partner.user.email,
        level: partner.user.level || 1,
        timezone: partner.user.timezone || 'UTC'
      },
      matchScore: Math.round(partner.matchScore * 10) / 10, // Round to 1 decimal
      commonHabits: partner.commonHabits || [],
      commonCategories: partner.commonCategories || [],
      habitCount: partner.habitCount || 0,
      matchingCriteria: {
        habitSimilarity: partner.matchingCriteria?.habitSimilarity || 75,
        timezoneCompatibility: partner.matchingCriteria?.timezoneCompatibility || 85,
        activityLevel: partner.matchingCriteria?.activityLevel || 70,
        goalAlignment: partner.matchingCriteria?.goalAlignment || 80
      }
    }));

    console.log(`🎯 Returning ${simplifiedPartners.length} partners to frontend`);

    res.json({
      success: true,
      partners: simplifiedPartners,
      total: simplifiedPartners.length,
      message: `Found ${simplifiedPartners.length} potential accountability partners`
    });

  } catch (error) {
    console.error('❌ Error finding partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find potential partners',
      error: error.message
    });
  }
};

// Send partnership request (simplified)
const sendPartnerRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId, message } = req.body;

    console.log('🤝 PARTNERSHIP REQUEST INITIATED:', {
      senderId: userId,
      partnerId: partnerId,
      message: message,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });

    console.log('🔐 Authentication check:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      userEmail: req.user?.email
    });

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID is required'
      });
    }

    // Check if partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      console.log('❌ Partner not found:', partnerId);
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Get sender info for logging
    const sender = await User.findById(userId).select('username email');
    console.log('👤 SENDER INFO:', {
      id: userId,
      username: sender.username,
      email: sender.email
    });
    console.log('🎯 RECEIVER INFO:', {
      id: partnerId,
      username: partner.username,
      email: partner.email
    });

    // Check if request already exists (more thorough check)
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Sender user not found in database:', userId);
      return res.status(404).json({
        success: false,
        message: 'Sender user not found'
      });
    }

    console.log('🔍 User structure check:', {
      hasPartnerRequests: !!user.partnerRequests,
      hasSentRequests: !!user.partnerRequests?.sent,
      hasReceivedRequests: !!user.partnerRequests?.received,
      hasPartnerships: !!user.partnerships,
      hasNotifications: !!user.notifications,
      sentRequestsCount: user.partnerRequests?.sent?.length || 0,
      receivedRequestsCount: user.partnerRequests?.received?.length || 0,
      partnershipsCount: user.partnerships?.length || 0,
      notificationsCount: user.notifications?.length || 0
    });

    // Initialize partnerRequests if it doesn't exist
    if (!user.partnerRequests) {
      console.log('🔧 Initializing partnerRequests for user:', userId);
      const initResult = await User.findByIdAndUpdate(userId, {
        $set: {
          'partnerRequests.sent': [],
          'partnerRequests.received': []
        }
      }, { new: true });

      if (!initResult) {
        console.error('❌ Failed to initialize partnerRequests for user:', userId);
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize user data'
        });
      }
      console.log('✅ PartnerRequests initialized for user:', userId);
    }

    // Check sent requests
    const existingSentRequest = user.partnerRequests?.sent?.find(
      req => req.to && req.to.toString() === partnerId
    );

    // Check if partner has a pending request from this user
    const partnerUser = await User.findById(partnerId);
    if (!partnerUser) {
      console.error('❌ Partner user not found in database:', partnerId);
      return res.status(404).json({
        success: false,
        message: 'Partner user not found'
      });
    }

    // Initialize partnerRequests for partner if it doesn't exist
    if (!partnerUser.partnerRequests) {
      console.log('🔧 Initializing partnerRequests for partner:', partnerId);
      const partnerInitResult = await User.findByIdAndUpdate(partnerId, {
        $set: {
          'partnerRequests.sent': [],
          'partnerRequests.received': []
        }
      }, { new: true });

      if (!partnerInitResult) {
        console.error('❌ Failed to initialize partnerRequests for partner:', partnerId);
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize partner data'
        });
      }
      console.log('✅ PartnerRequests initialized for partner:', partnerId);
    }

    const existingReceivedRequest = partnerUser.partnerRequests?.received?.find(
      req => req.from && req.from.toString() === userId
    );

    // Check if they're already partners
    const existingPartnership = user.partnerships?.find(
      p => p.partner && p.partner.toString() === partnerId && p.status === 'active'
    );

    if (existingSentRequest || existingReceivedRequest) {
      console.log('⚠️ Partnership request already exists:', {
        sentRequest: !!existingSentRequest,
        receivedRequest: !!existingReceivedRequest,
        userId: userId,
        partnerId: partnerId
      });

      // Provide more specific error message
      let message = 'Partnership request already sent';
      if (existingSentRequest) {
        message = 'You have already sent a partnership request to this user';
      } else if (existingReceivedRequest) {
        message = 'This user has already sent you a partnership request';
      }

      return res.status(400).json({
        success: false,
        message: message,
        debug: {
          hasSentRequest: !!existingSentRequest,
          hasReceivedRequest: !!existingReceivedRequest
        }
      });
    }

    if (existingPartnership) {
      return res.status(400).json({
        success: false,
        message: 'You are already partners with this user'
      });
    }

    // Add to sender's sent requests
    console.log('📤 Adding to sender\'s sent requests...');
    try {
      const senderUpdateResult = await User.findByIdAndUpdate(userId, {
        $push: {
          'partnerRequests.sent': {
            to: partnerId,
            message: message || 'Let\'s be accountability partners!',
            sentAt: new Date()
          }
        }
      }, { new: true });

      if (!senderUpdateResult) {
        console.error('❌ Failed to update sender\'s sent requests - user not found');
        return res.status(500).json({
          success: false,
          message: 'Failed to update sender\'s requests - user not found'
        });
      }
      console.log('✅ Sender\'s sent requests updated successfully');
    } catch (senderError) {
      console.error('❌ Error updating sender\'s sent requests:', senderError);
      return res.status(500).json({
        success: false,
        message: 'Database error updating sender requests',
        error: senderError.message
      });
    }

    // Add to receiver's received requests
    console.log('📥 Adding to receiver\'s received requests...');
    try {
      const receiverUpdateResult = await User.findByIdAndUpdate(partnerId, {
        $push: {
          'partnerRequests.received': {
            from: userId,
            message: message || 'Let\'s be accountability partners!',
            receivedAt: new Date()
          }
        }
      }, { new: true });

      if (!receiverUpdateResult) {
        console.error('❌ Failed to update receiver\'s received requests - user not found');
        return res.status(500).json({
          success: false,
          message: 'Failed to update receiver\'s requests - user not found'
        });
      }
      console.log('✅ Receiver\'s received requests updated successfully');
    } catch (receiverError) {
      console.error('❌ Error updating receiver\'s received requests:', receiverError);
      return res.status(500).json({
        success: false,
        message: 'Database error updating receiver requests',
        error: receiverError.message
      });
    }

    // Create notification for the receiver
    const senderUser = await User.findById(userId).select('username');
    if (!senderUser) {
      console.error('❌ Sender user not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'Sender user not found'
      });
    }

    console.log('📬 Creating partnership notification:', {
      receiverId: partnerId,
      senderId: userId,
      senderUsername: senderUser.username,
      message: message || 'Wants to be your accountability partner!'
    });

    // Create the notification object
    const notificationData = {
      type: 'partnership',
      from: userId,
      fromUsername: senderUser.username,
      message: message || `${senderUser.username} wants to be your accountability partner!`,
      read: false,
      createdAt: new Date(),
      // Add additional metadata for partnership requests
      metadata: {
        requestType: 'partnership',
        senderId: userId,
        senderUsername: senderUser.username
      }
    };

    console.log('📝 Notification data to be saved:', notificationData);

    try {
      const notificationResult = await User.findByIdAndUpdate(partnerId, {
        $push: {
          notifications: notificationData
        }
      }, { new: true, runValidators: true });

      if (!notificationResult) {
        console.error('❌ Failed to create notification - user not found');
        return res.status(500).json({
          success: false,
          message: 'Failed to create notification - user not found'
        });
      }

      console.log('✅ Partnership notification created successfully');
      console.log('📊 Receiver now has', notificationResult.notifications?.length || 0, 'total notifications');

      // Verify the notification was actually added
      const latestNotification = notificationResult.notifications[notificationResult.notifications.length - 1];
      console.log('🔍 Latest notification added:', {
        type: latestNotification.type,
        from: latestNotification.fromUsername,
        message: latestNotification.message?.substring(0, 50) + '...'
      });
    } catch (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
      return res.status(500).json({
        success: false,
        message: 'Database error creating notification',
        error: notificationError.message
      });
    }


    res.json({
      success: true,
      message: 'Partnership request sent successfully'
    });

  } catch (error) {
    console.error('❌ DETAILED ERROR sending partner request:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: req.user?.id,
      partnerId: req.body?.partnerId
    });

    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to send partnership request';
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid data provided for partnership request';
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid user ID provided';
    } else if (error.message.includes('duplicate')) {
      errorMessage = 'Partnership request already exists';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// Get user's partnerships (simplified)
const getUserPartnerships = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate('partnerships.partnerId', 'username email level stats')
      .populate('partnerRequests.sent.to', 'username email')
      .populate('partnerRequests.received.from', 'username email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      partnerships: user.partnerships || [],
      requests: {
        sent: user.partnerRequests.sent || [],
        received: user.partnerRequests.received || []
      }
    });

  } catch (error) {
    console.error('Error getting partnerships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get partnerships',
      error: error.message
    });
  }
};

// End partnership (simplified)
const endPartnership = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID is required'
      });
    }

    // Update partnership status for both users
    await User.findOneAndUpdate(
      { _id: userId, 'partnerships.partnerId': partnerId },
      { 
        $set: { 
          'partnerships.$.status': 'ended',
          'partnerships.$.endedAt': new Date()
        }
      }
    );

    await User.findOneAndUpdate(
      { _id: partnerId, 'partnerships.partnerId': userId },
      { 
        $set: { 
          'partnerships.$.status': 'ended',
          'partnerships.$.endedAt': new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Partnership ended successfully'
    });

  } catch (error) {
    console.error('Error ending partnership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end partnership',
      error: error.message
    });
  }
};

// Accept partnership request
const acceptPartnerRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnershipId } = req.params;

    // Find the request in user's received requests
    const user = await User.findById(userId);
    const request = user.partnerRequests.received.id(partnershipId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found'
      });
    }

    const partnerId = request.from;

    // Create partnership for both users
    await User.findByIdAndUpdate(userId, {
      $push: {
        partnerships: {
          partnerId: partnerId,
          status: 'active',
          matchScore: 85, // Default match score
          createdAt: new Date()
        }
      },
      $pull: {
        'partnerRequests.received': { _id: partnershipId }
      }
    });

    await User.findByIdAndUpdate(partnerId, {
      $push: {
        partnerships: {
          partnerId: userId,
          status: 'active',
          matchScore: 85, // Default match score
          createdAt: new Date()
        }
      },
      $pull: {
        'partnerRequests.sent': { to: userId }
      }
    });

    res.json({
      success: true,
      message: 'Partnership request accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept partnership request',
      error: error.message
    });
  }
};

// Accept partnership request by partner ID (for activities section)
const acceptPartnerRequestByPartnerId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.params;

    console.log('🤝 Accepting partnership request from partner:', partnerId, 'for user:', userId);

    // Find the request in user's received requests
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the partnership request from this partner
    const request = user.partnerRequests?.received?.find(req =>
      req.from && req.from.toString() === partnerId
    );

    if (!request) {
      console.log('❌ Partnership request not found from partner:', partnerId);
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found from this partner'
      });
    }

    console.log('✅ Found partnership request:', request);

    // Create partnership for both users
    await User.findByIdAndUpdate(userId, {
      $push: {
        partnerships: {
          partnerId: partnerId,
          status: 'active',
          matchScore: 85, // Default match score
          createdAt: new Date()
        }
      },
      $pull: {
        'partnerRequests.received': { from: partnerId }
      }
    });

    await User.findByIdAndUpdate(partnerId, {
      $push: {
        partnerships: {
          partnerId: userId,
          status: 'active',
          matchScore: 85, // Default match score
          createdAt: new Date()
        }
      },
      $pull: {
        'partnerRequests.sent': { to: userId }
      }
    });

    // Remove the partnership notification
    await User.findByIdAndUpdate(userId, {
      $pull: {
        notifications: {
          type: 'partnership',
          from: partnerId
        }
      }
    });

    console.log('✅ Partnership created successfully between', userId, 'and', partnerId);

    res.json({
      success: true,
      message: 'Partnership request accepted successfully',
      partnership: {
        partnerId: partnerId,
        status: 'active',
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error accepting partnership request by partner ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept partnership request',
      error: error.message
    });
  }
};

// Decline/Cancel partnership request
const declinePartnerRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    // Remove from both users' request arrays
    await User.findByIdAndUpdate(userId, {
      $pull: {
        'partnerRequests.received': { _id: requestId },
        'partnerRequests.sent': { _id: requestId }
      }
    });

    // Find and remove from the other user's requests too
    const user = await User.findById(userId);
    const receivedRequest = user.partnerRequests.received.id(requestId);
    const sentRequest = user.partnerRequests.sent.id(requestId);

    if (receivedRequest) {
      // This is a received request being declined
      await User.findByIdAndUpdate(receivedRequest.from, {
        $pull: {
          'partnerRequests.sent': { to: userId }
        }
      });
    } else if (sentRequest) {
      // This is a sent request being cancelled
      await User.findByIdAndUpdate(sentRequest.to, {
        $pull: {
          'partnerRequests.received': { from: userId }
        }
      });
    }

    res.json({
      success: true,
      message: 'Partnership request removed successfully'
    });

  } catch (error) {
    console.error('Error removing partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove partnership request',
      error: error.message
    });
  }
};

// Decline partnership request by partner ID (for activities section)
const declinePartnerRequestByPartnerId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.params;

    console.log('❌ Declining partnership request from partner:', partnerId, 'for user:', userId);

    // Remove from both users' request arrays
    await User.findByIdAndUpdate(userId, {
      $pull: {
        'partnerRequests.received': { from: partnerId }
      }
    });

    await User.findByIdAndUpdate(partnerId, {
      $pull: {
        'partnerRequests.sent': { to: userId }
      }
    });

    // Remove the partnership notification
    await User.findByIdAndUpdate(userId, {
      $pull: {
        notifications: {
          type: 'partnership',
          from: partnerId
        }
      }
    });

    console.log('✅ Partnership request declined successfully');

    res.json({
      success: true,
      message: 'Partnership request declined successfully'
    });

  } catch (error) {
    console.error('❌ Error declining partnership request by partner ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline partnership request',
      error: error.message
    });
  }
};

// Send motivation message to partner
const sendMotivationMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId, message } = req.body;

    if (!partnerId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID and message are required'
      });
    }

    // Verify partnership exists
    const user = await User.findById(userId);
    const partnership = user.partnerships?.find(p => p.partnerId && p.partnerId.toString() === partnerId && p.status === 'active');

    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Active partnership not found'
      });
    }

    // Get sender info
    const senderUser = await User.findById(userId).select('username');

    console.log('💪 Creating motivation notification:', {
      receiverId: partnerId,
      senderId: userId,
      senderUsername: senderUser.username,
      message: message
    });

    // Create enhanced motivation notification for the partner
    const motivationNotification = {
      type: 'motivation',
      from: userId,
      fromUsername: senderUser.username,
      message: message,
      read: false,
      createdAt: new Date(),
      metadata: {
        messageType: 'motivation',
        senderId: userId,
        senderUsername: senderUser.username,
        emoji: '💪'
      }
    };

    const notificationResult = await User.findByIdAndUpdate(partnerId, {
      $push: {
        notifications: motivationNotification
      }
    }, { new: true });

    if (!notificationResult) {
      console.error('❌ Failed to create motivation notification');
      return res.status(500).json({
        success: false,
        message: 'Failed to create motivation notification'
      });
    }

    console.log('✅ Motivation notification created successfully');
    console.log('📊 Receiver now has', notificationResult.notifications?.length || 0, 'total notifications');

    res.json({
      success: true,
      message: 'Motivation sent successfully'
    });

  } catch (error) {
    console.error('Error sending motivation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send motivation',
      error: error.message
    });
  }
};

// Send challenge to partner
const sendPartnerChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId, title, description, duration, challengeType } = req.body;

    if (!partnerId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID and challenge title are required'
      });
    }

    // Verify partnership exists
    const user = await User.findById(userId);
    const partnership = user.partnerships?.find(p => p.partnerId && p.partnerId.toString() === partnerId && p.status === 'active');

    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Active partnership not found'
      });
    }

    // Get sender info
    const senderUser = await User.findById(userId).select('username');

    console.log('🎯 Creating challenge notification:', {
      receiverId: partnerId,
      senderId: userId,
      senderUsername: senderUser.username,
      challengeTitle: title,
      duration: duration || 24
    });

    // Create challenge notification for the partner
    const challengeNotification = {
      type: 'challenge',
      from: userId,
      fromUsername: senderUser.username,
      message: `${senderUser.username} has challenged you: ${title}`,
      read: false,
      createdAt: new Date(),
      metadata: {
        challengeTitle: title,
        challengeDescription: description || 'Challenge from your accountability partner!',
        challengeType: challengeType || 'general',
        duration: duration || 24,
        emoji: '⚔️',
        reward: 'Partnership XP + Badge',
        senderId: userId,
        senderUsername: senderUser.username
      }
    };

    const challengeResult = await User.findByIdAndUpdate(partnerId, {
      $push: {
        notifications: challengeNotification
      }
    }, { new: true });

    if (!challengeResult) {
      console.error('❌ Failed to create challenge notification');
      return res.status(500).json({
        success: false,
        message: 'Failed to create challenge notification'
      });
    }

    console.log('✅ Challenge notification created successfully');
    console.log('📊 Receiver now has', challengeResult.notifications?.length || 0, 'total notifications');

    res.json({
      success: true,
      message: 'Challenge sent successfully',
      challenge: {
        title,
        description,
        duration: duration || 24
      }
    });

  } catch (error) {
    console.error('Error sending challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send challenge',
      error: error.message
    });
  }
};

// Get available challenges for partner challenges
const getPartnerChallenges = async (req, res) => {
  try {
    console.log('🎯 Getting available challenges for partner challenges...');

    // Get all active challenges that can be used for partner challenges
    const challenges = await Challenge.find({
      status: { $in: ['pending', 'active'] }
    }).select('title description rewardPoints startDate endDate status')
      .sort({ createdAt: -1 })
      .limit(20);

    // Add some default partner-specific challenges if no challenges exist
    const defaultPartnerChallenges = [
      {
        _id: 'default-1',
        title: '24-Hour Habit Streak',
        description: 'Complete all your habits for the next 24 hours',
        rewardPoints: 50,
        duration: 24,
        type: 'habit_completion'
      },
      {
        _id: 'default-2',
        title: 'Morning Champion',
        description: 'Complete your morning routine before 10 AM for 3 days',
        rewardPoints: 75,
        duration: 72,
        type: 'morning_routine'
      },
      {
        _id: 'default-3',
        title: 'Consistency Challenge',
        description: 'Don\'t break your habit streak for the next 7 days',
        rewardPoints: 100,
        duration: 168,
        type: 'streak_building'
      },
      {
        _id: 'default-4',
        title: 'Wellness Focus',
        description: 'Focus on health and wellness habits for 5 days',
        rewardPoints: 80,
        duration: 120,
        type: 'wellness_focus'
      },
      {
        _id: 'default-5',
        title: 'Productivity Boost',
        description: 'Complete all productivity habits for 3 days straight',
        rewardPoints: 90,
        duration: 72,
        type: 'productivity'
      },
      {
        _id: 'default-6',
        title: 'Weekend Warrior',
        description: 'Maintain your habits during the weekend',
        rewardPoints: 60,
        duration: 48,
        type: 'weekend_challenge'
      }
    ];

    // Combine database challenges with default challenges
    const allChallenges = [...challenges, ...defaultPartnerChallenges];

    console.log(`✅ Found ${allChallenges.length} available challenges for partners`);

    res.json({
      success: true,
      challenges: allChallenges
    });

  } catch (error) {
    console.error('❌ Error fetching partner challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partner challenges',
      error: error.message
    });
  }
};

module.exports = {
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
};
