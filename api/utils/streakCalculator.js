/**
 * Streak Calculator Utility
 * Calculates true consecutive day streaks for habits
 */

/**
 * Calculate consecutive day streak from completion dates
 * @param {Date[]} completedDates - Array of completion dates
 * @param {string} newDate - New completion date (optional, for when adding a new completion)
 * @returns {number} - Consecutive day streak count
 */
const calculateConsecutiveStreak = (completedDates, newDate = null) => {
  if (!completedDates || completedDates.length === 0) {
    return newDate ? 1 : 0;
  }

  // Convert all dates to YYYY-MM-DD format and sort
  let dates = completedDates.map(date => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  });

  // Add new date if provided
  if (newDate) {
    const newDateStr = new Date(newDate).toISOString().split('T')[0];
    if (!dates.includes(newDateStr)) {
      dates.push(newDateStr);
    }
  }

  // Remove duplicates and sort in descending order (most recent first)
  dates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Start checking from today or yesterday
  let currentDate = new Date();
  
  // If today is completed, start from today, otherwise start from yesterday
  if (dates.includes(today)) {
    // Start counting from today
  } else if (dates.includes(yesterday)) {
    // Start counting from yesterday
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    // No recent completions, check if the most recent date creates a streak
    const mostRecentDate = dates[0];
    const daysSinceRecent = Math.floor((new Date(today) - new Date(mostRecentDate)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceRecent > 1) {
      // Gap is too large, no current streak
      return 0;
    } else if (daysSinceRecent === 1) {
      // Most recent was yesterday, start from there
      currentDate = new Date(mostRecentDate);
    } else {
      // Most recent is today (shouldn't happen due to first check, but safety)
      currentDate = new Date(mostRecentDate);
    }
  }

  // Count consecutive days backwards from the starting point
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (dates.includes(dateStr)) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Gap found, streak ends
      break;
    }
  }

  return streak;
};

/**
 * Check if a habit should maintain its streak when completed today
 * @param {Date[]} completedDates - Array of existing completion dates
 * @param {string} todayDate - Today's date string
 * @returns {boolean} - Whether the streak continues or resets
 */
const shouldMaintainStreak = (completedDates, todayDate) => {
  if (!completedDates || completedDates.length === 0) {
    return false; // New streak starts
  }

  const today = new Date(todayDate).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Convert dates to strings
  const dateStrings = completedDates.map(date => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  });

  // Check if yesterday was completed (maintains streak)
  // or if today is already completed (no change needed)
  return dateStrings.includes(yesterday) || dateStrings.includes(today);
};

/**
 * Get streak status information for display
 * @param {Date[]} completedDates - Array of completion dates
 * @returns {Object} - Streak information object
 */
const getStreakInfo = (completedDates) => {
  const streak = calculateConsecutiveStreak(completedDates);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const dateStrings = completedDates.map(date => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  });

  const completedToday = dateStrings.includes(today);
  const completedYesterday = dateStrings.includes(yesterday);

  let status = 'active'; // active, at-risk, broken

  if (streak === 0) {
    status = 'broken';
  } else if (!completedToday && !completedYesterday) {
    status = 'broken';
  } else if (!completedToday && completedYesterday) {
    status = 'at-risk';
  }

  return {
    streak,
    status,
    completedToday,
    completedYesterday,
    canContinueToday: !completedToday && (completedYesterday || streak === 0)
  };
};

module.exports = {
  calculateConsecutiveStreak,
  shouldMaintainStreak,
  getStreakInfo
};
