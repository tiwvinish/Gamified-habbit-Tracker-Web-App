const AccountabilityPartner = require('../models/AccountabilityPartner');
const User = require('../models/User');

// Get partner leaderboard (top 10 pairs by activity)
const getPartnerLeaderboard = async (req, res) => {
  try {
    const { timeframe = 'all_time', limit = 10 } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    // Set date filter based on timeframe
    switch (timeframe) {
      case 'weekly':
        dateFilter = { lastActivity: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'monthly':
        dateFilter = { lastActivity: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case 'daily':
        dateFilter = { lastActivity: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = {}; // all_time
    }

    const leaderboard = await AccountabilityPartner.find({
      status: 'active',
      ...dateFilter
    })
    .populate('user1', 'username level')
    .populate('user2', 'username level')
    .sort({ 
      'stats.totalXpEarned': -1,
      'duoStreak.currentStreak': -1,
      'stats.totalChallengesCompleted': -1
    })
    .limit(parseInt(limit));

    // Calculate activity scores and rankings
    const rankedLeaderboard = leaderboard.map((partnership, index) => {
      const activityScore = calculateActivityScore(partnership);
      
      return {
        rank: index + 1,
        partnershipId: partnership.partnershipId,
        users: [
          {
            username: partnership.user1.username,
            level: partnership.user1.level || 1
          },
          {
            username: partnership.user2.username,
            level: partnership.user2.level || 1
          }
        ],
        stats: {
          totalXpEarned: partnership.stats.totalXpEarned,
          totalChallengesCompleted: partnership.stats.totalChallengesCompleted,
          currentStreak: partnership.duoStreak.currentStreak,
          longestStreak: partnership.duoStreak.longestStreak,
          perfectDays: partnership.stats.perfectDays,
          badgesEarned: partnership.earnedBadges.length
        },
        activityScore,
        lastActivity: partnership.lastActivity
      };
    });

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      timeframe,
      total: rankedLeaderboard.length,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting partner leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting partner leaderboard',
      error: error.message
    });
  }
};

// Get streak leaderboard
const getStreakLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const streakLeaderboard = await AccountabilityPartner.find({
      status: 'active',
      'duoStreak.currentStreak': { $gt: 0 }
    })
    .populate('user1', 'username level')
    .populate('user2', 'username level')
    .sort({ 'duoStreak.currentStreak': -1, 'duoStreak.longestStreak': -1 })
    .limit(parseInt(limit));

    const rankedStreaks = streakLeaderboard.map((partnership, index) => ({
      rank: index + 1,
      partnershipId: partnership.partnershipId,
      users: [
        {
          username: partnership.user1.username,
          level: partnership.user1.level || 1
        },
        {
          username: partnership.user2.username,
          level: partnership.user2.level || 1
        }
      ],
      currentStreak: partnership.duoStreak.currentStreak,
      longestStreak: partnership.duoStreak.longestStreak,
      lastCheckIn: partnership.duoStreak.lastCheckIn
    }));

    res.json({
      success: true,
      streakLeaderboard: rankedStreaks,
      total: rankedStreaks.length,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting streak leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting streak leaderboard',
      error: error.message
    });
  }
};

// Get challenge leaderboard
const getChallengeLeaderboard = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'monthly' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case 'weekly':
        dateFilter = { 'completedChallenges.createdAt': { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'monthly':
        dateFilter = { 'completedChallenges.createdAt': { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = {};
    }

    const challengeLeaderboard = await AccountabilityPartner.find({
      status: 'active',
      'stats.totalChallengesCompleted': { $gt: 0 },
      ...dateFilter
    })
    .populate('user1', 'username level')
    .populate('user2', 'username level')
    .sort({ 'stats.totalChallengesCompleted': -1 })
    .limit(parseInt(limit));

    const rankedChallenges = challengeLeaderboard.map((partnership, index) => ({
      rank: index + 1,
      partnershipId: partnership.partnershipId,
      users: [
        {
          username: partnership.user1.username,
          level: partnership.user1.level || 1
        },
        {
          username: partnership.user2.username,
          level: partnership.user2.level || 1
        }
      ],
      totalChallengesCompleted: partnership.stats.totalChallengesCompleted,
      activeChallenges: partnership.activeChallenges.length,
      successRate: partnership.completedChallenges.length > 0 ? 
        (partnership.stats.totalChallengesCompleted / partnership.completedChallenges.length) * 100 : 0
    }));

    res.json({
      success: true,
      challengeLeaderboard: rankedChallenges,
      timeframe,
      total: rankedChallenges.length,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting challenge leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting challenge leaderboard',
      error: error.message
    });
  }
};

// Challenge another pair
const challengeAnotherPair = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengerPartnershipId, challengedPartnershipId, challengeType, duration = 7 } = req.body;

    // Verify challenger partnership
    const challengerPartnership = await AccountabilityPartner.findById(challengerPartnershipId)
      .populate('user1', 'username')
      .populate('user2', 'username');
    
    if (!challengerPartnership) {
      return res.status(404).json({
        success: false,
        message: 'Challenger partnership not found'
      });
    }

    // Verify user is part of challenger partnership
    if (challengerPartnership.user1._id.toString() !== userId && 
        challengerPartnership.user2._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create challenges for this partnership'
      });
    }

    // Verify challenged partnership
    const challengedPartnership = await AccountabilityPartner.findById(challengedPartnershipId)
      .populate('user1', 'username')
      .populate('user2', 'username');
    
    if (!challengedPartnership) {
      return res.status(404).json({
        success: false,
        message: 'Challenged partnership not found'
      });
    }

    // Create pair vs pair challenge
    const pairChallenge = {
      challengeId: `pair_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'pair_vs_pair',
      challengeType, // 'streak', 'habits_completed', 'xp_earned'
      challenger: {
        partnershipId: challengerPartnershipId,
        users: [challengerPartnership.user1.username, challengerPartnership.user2.username]
      },
      challenged: {
        partnershipId: challengedPartnershipId,
        users: [challengedPartnership.user1.username, challengedPartnership.user2.username]
      },
      duration, // days
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      rewards: {
        winner: { xp: 200, coins: 100 },
        participant: { xp: 50, coins: 25 }
      }
    };

    // Add challenge to both partnerships
    challengerPartnership.activeChallenges.push(pairChallenge);
    challengedPartnership.activeChallenges.push({
      ...pairChallenge,
      status: 'invited'
    });

    await Promise.all([
      challengerPartnership.save(),
      challengedPartnership.save()
    ]);

    res.json({
      success: true,
      challenge: pairChallenge,
      message: 'Pair challenge created successfully'
    });
  } catch (error) {
    console.error('Error creating pair challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pair challenge',
      error: error.message
    });
  }
};

// Helper function to calculate activity score
const calculateActivityScore = (partnership) => {
  const weights = {
    xp: 0.3,
    challenges: 0.25,
    streak: 0.25,
    perfectDays: 0.2
  };

  const normalizedXp = Math.min(partnership.stats.totalXpEarned / 1000, 100);
  const normalizedChallenges = Math.min(partnership.stats.totalChallengesCompleted * 10, 100);
  const normalizedStreak = Math.min(partnership.duoStreak.currentStreak * 5, 100);
  const normalizedPerfectDays = Math.min(partnership.stats.perfectDays * 3, 100);

  return Math.round(
    normalizedXp * weights.xp +
    normalizedChallenges * weights.challenges +
    normalizedStreak * weights.streak +
    normalizedPerfectDays * weights.perfectDays
  );
};

module.exports = {
  getPartnerLeaderboard,
  getStreakLeaderboard,
  getChallengeLeaderboard,
  challengeAnotherPair
};
