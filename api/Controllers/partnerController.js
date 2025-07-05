const AccountabilityPartner = require('../models/AccountabilityPartner');
const PairBadgeDefinition = require('../models/PairBadge');
const User = require('../models/User');

// Find potential accountability partners - show 5 random users excluding logged-in user
const findPotentialPartners = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔍 Finding 5 random partners for user ${userId}`);

    // Get 5 random users excluding the logged-in user
    const randomUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
          isActive: true
        }
      },
      { $sample: { size: 5 } }
    ]);

    console.log(`📊 Found ${randomUsers.length} random users`);

    // Create partner objects with random compatibility scores
    const partners = randomUsers.map(user => ({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        level: user.level || 1,
        timezone: user.timezone || 'UTC',
        stats: user.stats || {}
      },
      matchScore: Math.round((Math.random() * 40 + 50) * 10) / 10, // Random score 50-90%
      matchingCriteria: {
        habitSimilarity: Math.round(Math.random() * 100),
        timezoneCompatibility: 100,
        activityLevel: Math.round(Math.random() * 100),
        goalAlignment: Math.round(Math.random() * 100)
      },
      commonHabits: ['Exercise', 'Reading'],
      habitCount: Math.floor(Math.random() * 10) + 1,
      commonCategories: ['Health', 'Productivity']
    }));

    console.log(`✅ Returning ${partners.length} partners`);
    console.log('Partner usernames:', partners.map(p => p.user.username));

    res.json({
      success: true,
      partners: partners,
      total: partners.length,
      message: `Found ${partners.length} potential accountability partners`
    });
  } catch (error) {
    console.error('Error finding potential partners:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding potential partners',
      error: error.message
    });
  }
};

// Send partnership request
const sendPartnershipRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId, message } = req.body;

    // Check if partnership already exists
    const existingPartnership = await AccountabilityPartner.findOne({
      $or: [
        { user1: userId, user2: partnerId },
        { user1: partnerId, user2: userId }
      ]
    });

    if (existingPartnership) {
      return res.status(400).json({
        success: false,
        message: 'Partnership already exists or is pending'
      });
    }

    // Calculate match score
    const potentialPartners = await findAccountabilityPartners(userId, 20);
    const partnerMatch = potentialPartners.find(p => p.user.id.toString() === partnerId);
    
    if (!partnerMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid partner selection'
      });
    }

    // Create partnership request
    const partnership = new AccountabilityPartner({
      user1: userId,
      user2: partnerId,
      status: 'pending',
      matchScore: partnerMatch.matchScore,
      matchingCriteria: partnerMatch.matchingCriteria
    });

    await partnership.save();

    res.json({
      success: true,
      partnership,
      message: 'Partnership request sent successfully'
    });
  } catch (error) {
    console.error('Error sending partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending partnership request',
      error: error.message
    });
  }
};

// Accept partnership request
const acceptPartnershipRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnershipId } = req.params;

    const partnership = await AccountabilityPartner.findById(partnershipId);
    
    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Partnership request not found'
      });
    }

    // Check if user is the intended recipient
    if (partnership.user2.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    // Update partnership status
    partnership.status = 'active';
    partnership.acceptedAt = new Date();
    await partnership.save();

    res.json({
      success: true,
      partnership,
      message: 'Partnership request accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting partnership request',
      error: error.message
    });
  }
};

// Get user's partnerships
const getUserPartnerships = async (req, res) => {
  try {
    const userId = req.user.id;

    const partnerships = await AccountabilityPartner.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: { $in: ['pending', 'active'] }
    })
    .populate('user1', 'username email level')
    .populate('user2', 'username email level')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      partnerships,
      total: partnerships.length
    });
  } catch (error) {
    console.error('Error getting user partnerships:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting partnerships',
      error: error.message
    });
  }
};

// Create partner challenge
const createPartnerChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnershipId } = req.params;
    const { title, description, habitId, timeLimit = 24 } = req.body;

    const partnership = await AccountabilityPartner.findById(partnershipId);
    
    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Partnership not found'
      });
    }

    // Check if user is part of this partnership
    if (partnership.user1.toString() !== userId && partnership.user2.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create challenges for this partnership'
      });
    }

    // Create challenge
    await partnership.createChallenge({
      title,
      description,
      habitId,
      timeLimit
    });

    res.json({
      success: true,
      partnership,
      message: 'Challenge created successfully'
    });
  } catch (error) {
    console.error('Error creating partner challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating challenge',
      error: error.message
    });
  }
};

// Complete partner challenge
const completePartnerChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnershipId, challengeId } = req.params;

    const partnership = await AccountabilityPartner.findById(partnershipId);
    
    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Partnership not found'
      });
    }

    // Check if user is part of this partnership
    if (partnership.user1.toString() !== userId && partnership.user2.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Complete challenge
    await partnership.completeChallenge(challengeId, userId);

    // Check for new badges
    await checkAndAwardBadges(partnership);

    res.json({
      success: true,
      partnership,
      message: 'Challenge completed successfully'
    });
  } catch (error) {
    console.error('Error completing partner challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing challenge',
      error: error.message
    });
  }
};

// Update duo streak
const updateDuoStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnershipId } = req.params;
    const { user1CheckedIn, user2CheckedIn } = req.body;

    const partnership = await AccountabilityPartner.findById(partnershipId);
    
    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Partnership not found'
      });
    }

    // Update streak
    await partnership.updateDuoStreak(user1CheckedIn, user2CheckedIn);

    // Check for new badges
    await checkAndAwardBadges(partnership);

    res.json({
      success: true,
      partnership,
      message: 'Duo streak updated successfully'
    });
  } catch (error) {
    console.error('Error updating duo streak:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating duo streak',
      error: error.message
    });
  }
};

// Helper function to check and award badges
const checkAndAwardBadges = async (partnership) => {
  try {
    const allBadges = await PairBadgeDefinition.find({ isActive: true });
    
    for (const badgeDefinition of allBadges) {
      // Check if badge is already earned
      const alreadyEarned = partnership.earnedBadges.some(
        badge => badge.badgeId === badgeDefinition.badgeId
      );
      
      if (alreadyEarned) continue;
      
      // Check if criteria is met
      const isEligible = PairBadgeDefinition.checkBadgeEligibility(
        partnership,
        badgeDefinition.criteria
      );
      
      if (isEligible) {
        // Award badge
        partnership.earnedBadges.push({
          badgeId: badgeDefinition.badgeId,
          name: badgeDefinition.name,
          description: badgeDefinition.description,
          icon: badgeDefinition.icon,
          criteria: badgeDefinition.criteria.type
        });
        
        // Award rewards
        partnership.stats.totalXpEarned += badgeDefinition.rewards.xp || 0;
        partnership.stats.totalCoinsEarned += badgeDefinition.rewards.coins || 0;
        
        console.log(`🏆 Badge awarded: ${badgeDefinition.name} to partnership ${partnership.partnershipId}`);
      }
    }
    
    await partnership.save();
  } catch (error) {
    console.error('Error checking badges:', error);
  }
};

// Send motivational message to partner
const sendMotivationMessage = async (req, res) => {
  try {
    console.log('💪 SENDING MOTIVATION MESSAGE');
    const userId = req.user.id;
    const { partnerId, message } = req.body;

    console.log(`📨 Sending motivation from ${userId} to ${partnerId}: "${message}"`);

    if (!partnerId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID and message are required'
      });
    }

    // Check if partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Get sender info
    const sender = await User.findById(userId);

    // Add motivation message to partner's notifications
    await User.findByIdAndUpdate(partnerId, {
      $push: {
        'notifications': {
          type: 'motivation',
          from: userId,
          fromUsername: sender.username,
          message: message,
          createdAt: new Date(),
          read: false
        }
      }
    });

    console.log('✅ Motivation message sent successfully');

    res.json({
      success: true,
      message: 'Motivational message sent successfully!'
    });

  } catch (error) {
    console.error('❌ Error sending motivation message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send motivational message',
      error: error.message
    });
  }
};

// Send instant challenge to partner
const sendInstantChallenge = async (req, res) => {
  try {
    console.log('⚔️ SENDING INSTANT CHALLENGE');
    const userId = req.user.id;
    const { partnerId, challengeType, customMessage } = req.body;

    console.log(`🎯 Sending ${challengeType} challenge from ${userId} to ${partnerId}`);

    if (!partnerId || !challengeType) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID and challenge type are required'
      });
    }

    // Check if partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Get sender info
    const sender = await User.findById(userId);

    // Define challenge templates
    const challengeTemplates = {
      habit_completion: {
        title: '24h Habit Challenge',
        description: 'Complete all your habits within 24 hours!',
        timeLimit: 24,
        emoji: '✅',
        reward: '50 XP + 25 coins'
      },
      morning_routine: {
        title: 'Morning Warrior Challenge',
        description: 'Complete your morning routine before 10 AM!',
        timeLimit: 12,
        emoji: '🌅',
        reward: '40 XP + 20 coins'
      },
      streak_boost: {
        title: 'Streak Booster Challenge',
        description: 'Maintain your current streak for 3 more days!',
        timeLimit: 72,
        emoji: '🔥',
        reward: '75 XP + 35 coins'
      },
      wellness_focus: {
        title: 'Wellness Wednesday',
        description: 'Focus on health and wellness habits today!',
        timeLimit: 24,
        emoji: '🧘',
        reward: '60 XP + 30 coins'
      }
    };

    const challenge = challengeTemplates[challengeType] || challengeTemplates.habit_completion;

    // Add challenge to partner's notifications
    await User.findByIdAndUpdate(partnerId, {
      $push: {
        'notifications': {
          type: 'challenge',
          from: userId,
          fromUsername: sender.username,
          challengeType: challengeType,
          title: challenge.title,
          description: challenge.description,
          emoji: challenge.emoji,
          reward: challenge.reward,
          timeLimit: challenge.timeLimit,
          customMessage: customMessage || '',
          createdAt: new Date(),
          read: false,
          status: 'pending'
        }
      }
    });

    console.log(`✅ ${challenge.title} sent successfully`);

    res.json({
      success: true,
      challenge: challenge,
      message: `${challenge.title} sent successfully!`
    });

  } catch (error) {
    console.error('❌ Error sending instant challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send challenge',
      error: error.message
    });
  }
};

module.exports = {
  findPotentialPartners,
  sendPartnershipRequest,
  acceptPartnershipRequest,
  getUserPartnerships,
  createPartnerChallenge,
  completePartnerChallenge,
  updateDuoStreak,
  sendMotivationMessage,
  sendInstantChallenge
};
