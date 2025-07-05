const User = require('../models/User');
const Habit = require('../models/Habit');

/**
 * KNN-based accountability partner matching algorithm
 * Finds the best partner matches based on multiple criteria
 */

// Calculate habit similarity between two users
const calculateHabitSimilarity = (user1Habits, user2Habits) => {
  // Give base compatibility for new users (helps them discover each other)
  if (!user1Habits.length && !user2Habits.length) return 50; // Both new users
  if (!user1Habits.length || !user2Habits.length) return 25; // One new user

  const user1Categories = new Set(user1Habits.map(h => h.category));
  const user2Categories = new Set(user2Habits.map(h => h.category));
  
  // Jaccard similarity for categories
  const intersection = new Set([...user1Categories].filter(x => user2Categories.has(x)));
  const union = new Set([...user1Categories, ...user2Categories]);
  const categorySimilarity = intersection.size / union.size;

  // Difficulty level similarity
  const user1AvgDifficulty = user1Habits.reduce((sum, h) => {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    return sum + (difficultyMap[h.difficulty] || 2);
  }, 0) / user1Habits.length;

  const user2AvgDifficulty = user2Habits.reduce((sum, h) => {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    return sum + (difficultyMap[h.difficulty] || 2);
  }, 0) / user2Habits.length;

  const difficultyDiff = Math.abs(user1AvgDifficulty - user2AvgDifficulty);
  const difficultySimilarity = Math.max(0, 1 - difficultyDiff / 2);

  // Frequency similarity
  const user1Frequencies = user1Habits.map(h => h.frequency || 'daily');
  const user2Frequencies = user2Habits.map(h => h.frequency || 'daily');
  
  const frequencyMatches = user1Frequencies.filter(f => user2Frequencies.includes(f)).length;
  const frequencySimilarity = frequencyMatches / Math.max(user1Frequencies.length, user2Frequencies.length);

  // Weighted average
  return (categorySimilarity * 0.4 + difficultySimilarity * 0.3 + frequencySimilarity * 0.3) * 100;
};

// Calculate timezone compatibility
const calculateTimezoneCompatibility = (user1, user2) => {
  const tz1 = user1.timezone || 'UTC';
  const tz2 = user2.timezone || 'UTC';
  
  if (tz1 === tz2) return 100;
  
  // Simple timezone difference calculation (in practice, use a proper timezone library)
  const timezoneOffsets = {
    'UTC': 0, 'EST': -5, 'PST': -8, 'CST': -6, 'MST': -7,
    'GMT': 0, 'CET': 1, 'JST': 9, 'IST': 5.5, 'AEST': 10
  };
  
  const offset1 = timezoneOffsets[tz1] || 0;
  const offset2 = timezoneOffsets[tz2] || 0;
  const hoursDiff = Math.abs(offset1 - offset2);
  
  // Higher compatibility for closer timezones
  return Math.max(0, 100 - (hoursDiff * 10));
};

// Calculate activity level similarity
const calculateActivityLevel = (user1Stats, user2Stats) => {
  const user1Activity = (user1Stats.totalHabitsCompleted || 0) + (user1Stats.currentStreak || 0) * 2;
  const user2Activity = (user2Stats.totalHabitsCompleted || 0) + (user2Stats.currentStreak || 0) * 2;
  
  if (user1Activity === 0 && user2Activity === 0) return 100;
  if (user1Activity === 0 || user2Activity === 0) return 20;
  
  const ratio = Math.min(user1Activity, user2Activity) / Math.max(user1Activity, user2Activity);
  return ratio * 100;
};

// Calculate goal alignment
const calculateGoalAlignment = (user1, user2) => {
  const user1Goals = user1.goals || [];
  const user2Goals = user2.goals || [];
  
  if (!user1Goals.length || !user2Goals.length) return 50;
  
  const commonGoals = user1Goals.filter(goal => user2Goals.includes(goal));
  return (commonGoals.length / Math.max(user1Goals.length, user2Goals.length)) * 100;
};

// Main KNN matching function
const findAccountabilityPartners = async (userId, k = 5) => {
  try {
    console.log(`🔍 Finding accountability partners for user ${userId}`);
    
    // Get current user and their habits
    const currentUser = await User.findById(userId).populate('stats');
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    const currentUserHabits = await Habit.find({ user: userId });
    
    // Get all other active users (exclude current user and existing partners)
    const allUsers = await User.find({ 
      _id: { $ne: userId },
      isActive: true 
    }).populate('stats');
    
    console.log(`📊 Analyzing ${allUsers.length} potential partners`);
    
    const candidates = [];
    
    for (const user of allUsers) {
      try {
        // Get user's habits
        const userHabits = await Habit.find({ user: user._id });

        // Include all users in KNN algorithm, even those without habits
        // This ensures users appear in each other's discovery section
        
        // Calculate similarity scores
        const habitSimilarity = calculateHabitSimilarity(currentUserHabits, userHabits);
        const timezoneCompatibility = calculateTimezoneCompatibility(currentUser, user);
        const activityLevel = calculateActivityLevel(currentUser.stats || {}, user.stats || {});
        const goalAlignment = calculateGoalAlignment(currentUser, user);
        
        // Calculate overall match score (weighted average)
        const matchScore = (
          habitSimilarity * 0.35 +
          timezoneCompatibility * 0.25 +
          activityLevel * 0.25 +
          goalAlignment * 0.15
        );
        
        // Calculate common habits and categories for KNN
        const allCommonHabits = currentUserHabits.filter(currentHabit =>
          currentHabit.name && userHabits.some(userHabit =>
            userHabit.name && userHabit.name.toLowerCase() === currentHabit.name.toLowerCase()
          )
        );

        const currentUserCategories = [...new Set(currentUserHabits.map(h => h.category).filter(Boolean))];
        const userCategories = [...new Set(userHabits.map(h => h.category).filter(Boolean))];
        const allCommonCategories = currentUserCategories.filter(cat => userCategories.includes(cat));

        // Diversify common interests shown to user - rotate through different combinations
        const diversifyCommonInterests = (allItems, maxShow = 3, userSeed = userId) => {
          if (allItems.length <= maxShow) return allItems;

          // Create a deterministic but varied selection based on user ID, partner ID, and time
          const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 365;
          const combinedSeed = `${userSeed}-${user._id}-${dayOfYear}`;

          // Simple hash function for consistent randomization
          let seedHash = 0;
          for (let i = 0; i < combinedSeed.length; i++) {
            const char = combinedSeed.charCodeAt(i);
            seedHash = ((seedHash << 5) - seedHash) + char;
            seedHash = seedHash & seedHash; // Convert to 32-bit integer
          }

          // Use absolute value and modulo to get starting index
          const startIndex = Math.abs(seedHash) % allItems.length;
          const selected = [];

          // Select items in a rotating fashion to ensure variety
          for (let i = 0; i < Math.min(maxShow, allItems.length); i++) {
            const index = (startIndex + i * 2) % allItems.length; // Skip by 2 for more variety
            if (!selected.includes(allItems[index])) {
              selected.push(allItems[index]);
            }
          }

          // If we don't have enough unique items, fill with remaining items
          if (selected.length < maxShow && selected.length < allItems.length) {
            for (let item of allItems) {
              if (!selected.includes(item) && selected.length < maxShow) {
                selected.push(item);
              }
            }
          }

          return selected;
        };

        // Get diversified common interests (max 3 each to avoid repetition)
        const commonHabits = diversifyCommonInterests(allCommonHabits.map(h => h.name), 3);
        const commonCategories = diversifyCommonInterests(allCommonCategories, 3);

        candidates.push({
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            timezone: user.timezone || 'UTC',
            level: user.level || 1,
            stats: user.stats || {}
          },
          matchScore: Math.round(matchScore * 100) / 100,
          matchingCriteria: {
            habitSimilarity: Math.round(habitSimilarity * 100) / 100,
            timezoneCompatibility: Math.round(timezoneCompatibility * 100) / 100,
            activityLevel: Math.round(activityLevel * 100) / 100,
            goalAlignment: Math.round(goalAlignment * 100) / 100
          },
          commonHabits: commonHabits.map(h => h.name),
          habitCount: userHabits.length,
          commonCategories: commonCategories
        });
      } catch (error) {
        console.error(`Error analyzing user ${user._id}:`, error);
        continue;
      }
    }
    
    // Sort by match score and return top k candidates
    const topMatches = candidates
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, k);
    
    console.log(`✅ Found ${topMatches.length} potential partners`);
    console.log('Top matches:', topMatches.map(m => ({
      username: m.user.username,
      score: m.matchScore
    })));
    
    return topMatches;
    
  } catch (error) {
    console.error('❌ Error in partner matching:', error);
    throw error;
  }
};

// Find partners with specific criteria
const findPartnersWithCriteria = async (userId, criteria = {}) => {
  const {
    minMatchScore = 60,
    preferredTimezone,
    preferredCategories = [],
    activityLevelRange = [0, 100]
  } = criteria;
  
  const allMatches = await findAccountabilityPartners(userId, 20);
  
  return allMatches.filter(match => {
    // Filter by minimum match score
    if (match.matchScore < minMatchScore) return false;
    
    // Filter by timezone preference
    if (preferredTimezone && match.user.timezone !== preferredTimezone) return false;
    
    // Filter by category preferences
    if (preferredCategories.length > 0) {
      const hasPreferredCategory = preferredCategories.some(cat => 
        match.commonCategories.includes(cat)
      );
      if (!hasPreferredCategory) return false;
    }
    
    // Filter by activity level
    const activityScore = match.matchingCriteria.activityLevel;
    if (activityScore < activityLevelRange[0] || activityScore > activityLevelRange[1]) {
      return false;
    }
    
    return true;
  });
};

// Re-evaluate existing partnerships
const evaluatePartnershipCompatibility = async (partnershipId) => {
  try {
    const AccountabilityPartner = require('../models/AccountabilityPartner');
    const partnership = await AccountabilityPartner.findById(partnershipId)
      .populate('user1')
      .populate('user2');
    
    if (!partnership) return null;
    
    const user1Habits = await Habit.find({ user: partnership.user1._id });
    const user2Habits = await Habit.find({ user: partnership.user2._id });
    
    const habitSimilarity = calculateHabitSimilarity(user1Habits, user2Habits);
    const timezoneCompatibility = calculateTimezoneCompatibility(partnership.user1, partnership.user2);
    const activityLevel = calculateActivityLevel(
      partnership.user1.stats || {}, 
      partnership.user2.stats || {}
    );
    const goalAlignment = calculateGoalAlignment(partnership.user1, partnership.user2);
    
    const newMatchScore = (
      habitSimilarity * 0.35 +
      timezoneCompatibility * 0.25 +
      activityLevel * 0.25 +
      goalAlignment * 0.15
    );
    
    return {
      partnershipId,
      currentScore: partnership.matchScore,
      newScore: Math.round(newMatchScore * 100) / 100,
      improvement: Math.round((newMatchScore - partnership.matchScore) * 100) / 100,
      criteria: {
        habitSimilarity: Math.round(habitSimilarity * 100) / 100,
        timezoneCompatibility: Math.round(timezoneCompatibility * 100) / 100,
        activityLevel: Math.round(activityLevel * 100) / 100,
        goalAlignment: Math.round(goalAlignment * 100) / 100
      }
    };
  } catch (error) {
    console.error('Error evaluating partnership:', error);
    return null;
  }
};

module.exports = {
  findAccountabilityPartners,
  findPartnersWithCriteria,
  evaluatePartnershipCompatibility,
  calculateHabitSimilarity,
  calculateTimezoneCompatibility,
  calculateActivityLevel,
  calculateGoalAlignment
};
