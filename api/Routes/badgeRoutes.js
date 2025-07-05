const express = require('express');
const router = express.Router();

const {
  getAllBadges,
  getBadgeById,
  createBadge,
  updateBadge,
  deleteBadge,
  checkAndUnlockBadges
} = require('../Controllers/badgeController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes - anyone can view badges
router.get('/', getAllBadges);

// Test route (must be before /:id route)
router.get('/test/logs', (req, res) => {
  console.log('🧪 TEST ROUTE HIT - Console logging works!');
  res.json({ message: 'Test route works, check console' });
});

router.get('/:id', getBadgeById);

// User badge checking
router.post('/check', authMiddleware, checkAndUnlockBadges);

// Admin-only routes - only admins can manage badges
router.post('/', authMiddleware, adminMiddleware, createBadge);
router.put('/:id', authMiddleware, adminMiddleware, updateBadge);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBadge);

module.exports = router;
