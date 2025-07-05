const express = require('express');
const router = express.Router();
const auth = require('../Middleware/authMiddleware');
const {
  getPartnerLeaderboard,
  getStreakLeaderboard,
  getChallengeLeaderboard,
  challengeAnotherPair
} = require('../Controllers/leaderboardController');

// Get partner leaderboard (top 10 pairs by activity)
router.get('/partners', auth, getPartnerLeaderboard);

// Get streak leaderboard
router.get('/streaks', auth, getStreakLeaderboard);

// Get challenge leaderboard
router.get('/challenges', auth, getChallengeLeaderboard);

// Challenge another pair
router.post('/challenge-pair', auth, challengeAnotherPair);

module.exports = router;
