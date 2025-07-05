const express = require('express');
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminStats,
  getAllUsers,
  getAllHabits,
} = require('../Controllers/adminController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected routes - only admins
router.get('/me', authMiddleware, getAdmin);
router.put('/me', authMiddleware, updateAdmin);
router.delete('/me', authMiddleware, deleteAdmin);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working!' });
});

// Admin stats and data routes
router.get('/stats', authMiddleware, getAdminStats);
router.get('/users', authMiddleware, getAllUsers);
router.get('/habits', authMiddleware, getAllHabits);

module.exports = router;
