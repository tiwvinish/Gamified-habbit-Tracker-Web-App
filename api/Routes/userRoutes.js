const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
const authMiddleware = require('../Middleware/authMiddleware');
const adminMiddleware = require('../Middleware/adminMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes - need valid JWT
router.get('/profile', authMiddleware, userController.getUser);
router.put('/profile', authMiddleware, userController.updateUser);
router.delete('/profile', authMiddleware, userController.deleteUser);
router.get('/stats', authMiddleware, userController.getUserStats);

// Enhanced Notification routes
router.get('/notifications', authMiddleware, userController.getUserNotifications);
router.put('/notifications/:notificationId/read', authMiddleware, userController.markNotificationAsRead);
router.put('/notifications/read-all', authMiddleware, userController.markAllNotificationsAsRead);
router.delete('/notifications/:notificationId', authMiddleware, userController.deleteNotification);
router.delete('/notifications', authMiddleware, userController.clearAllNotifications);

// Public profile route - get user profile by ID (for viewing other users)
router.get('/profile/:userId', authMiddleware, userController.getUserProfile);

// Admin routes - need valid JWT + admin role
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUserById);

module.exports = router;
