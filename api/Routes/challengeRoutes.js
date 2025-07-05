const express = require('express');
const router = express.Router();

const {
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  leaveChallenge,
  updateProgress,
  getUserJoinedChallenges,
} = require('../Controllers/challengeController');

const authMiddleware = require('../Middleware/authMiddleware');

// Public routes
router.get('/', getAllChallenges);

// Protected routes (authentication required)
router.post('/', authMiddleware, createChallenge);

// Test route
router.get('/test-simple', (req, res) => {
  res.json({ message: 'Simple test works!' });
});

// Specific routes with parameters - must come before generic /:id routes
router.get('/joined', authMiddleware, getUserJoinedChallenges);
router.post('/leave', authMiddleware, leaveChallenge);
router.post('/:id/join', authMiddleware, joinChallenge);
router.put('/:id/progress', authMiddleware, updateProgress);

// Generic parameterized routes - must come after specific routes
router.get('/:id', getChallengeById);
router.put('/:id', authMiddleware, updateChallenge);
router.delete('/:id', authMiddleware, deleteChallenge);

module.exports = router;
