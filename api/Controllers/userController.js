const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to validate username (simplified)
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, message: 'Username is required' };
  }

  const trimmedUsername = username.trim();

  // Check minimum length
  if (trimmedUsername.length < 1) {
    return { isValid: false, message: 'Username is required' };
  }

  // Check if username is only numbers
  if (/^\d+$/.test(trimmedUsername)) {
    return { isValid: false, message: 'Username cannot be only numbers' };
  }

  // Check if username is only symbols/special characters
  if (/^[^a-zA-Z0-9\s]+$/.test(trimmedUsername)) {
    return { isValid: false, message: 'Username cannot be only symbols' };
  }

  return { isValid: true, message: 'Valid username' };
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({
        message: usernameValidation.message,
        field: 'username'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Check if username is already taken
    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username is already taken',
        field: 'username'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with role (defaults to 'user' if not specified)
    user = new User({
      username: username.trim(),
      email,
      password: hashedPassword,
      role: role || 'user'
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error registering user' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error logging in' });
  }
};

// Get logged in user info
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

// Update user profile
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { username, email, password } = req.body;

    // Validate input
    if (username !== undefined) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        return res.status(400).json({
          message: usernameValidation.message,
          field: 'username'
        });
      }

      // Check if username is already taken by another user
      const existingUsername = await User.findOne({
        username: username.trim(),
        _id: { $ne: user._id }
      });

      if (existingUsername) {
        return res.status(400).json({
          message: 'Username is already taken by another user',
          field: 'username'
        });
      }

      user.username = username.trim();
    }

    if (email !== undefined) {
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          message: 'Please provide a valid email address',
          field: 'email'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'Email is already taken by another user',
          field: 'email'
        });
      }

      user.email = email.toLowerCase().trim();
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters long',
          field: 'password'
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    console.log('✅ User profile updated:', {
      userId: user._id,
      username: user.username,
      email: user.email
    });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      points: user.points,
      streak: user.streak,
      level: user.level,
      badges: user.badges,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Email is already taken by another user',
        field: 'email'
      });
    }

    res.status(500).json({ message: 'Server error updating user profile' });
  }
};

// Delete own user account
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// Admin: Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Admin: Delete user by ID
const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user by ID:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// Get user statistics for profile
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get user's habits
    const Habit = require('../models/Habit');
    const habits = await Habit.find({ user: userId });

    // Calculate statistics
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((total, habit) => total + habit.completedDates.length, 0);
    const totalXP = habits.reduce((total, habit) => total + habit.pointsEarned, 0);

    // Calculate streaks
    const { calculateConsecutiveStreak } = require('../utils/streakCalculator');
    const streaks = habits.map(habit => calculateConsecutiveStreak(habit.completedDates));
    const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const avgStreak = streaks.length > 0 ? (streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0;

    // Category breakdown
    const categoryStats = {};
    habits.forEach(habit => {
      if (!categoryStats[habit.category]) {
        categoryStats[habit.category] = {
          count: 0,
          completions: 0,
          xp: 0
        };
      }
      categoryStats[habit.category].count++;
      categoryStats[habit.category].completions += habit.completedDates.length;
      categoryStats[habit.category].xp += habit.pointsEarned;
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCompletions = habits.reduce((total, habit) => {
      return total + habit.completedDates.filter(date => new Date(date) >= sevenDaysAgo).length;
    }, 0);

    // Account age
    const accountAge = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

    const stats = {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
        createdAt: user.createdAt,
        accountAge
      },
      habits: {
        total: totalHabits,
        totalCompletions,
        totalXP,
        maxStreak,
        avgStreak: Math.round(avgStreak * 10) / 10,
        recentCompletions,
        categoryBreakdown: categoryStats
      },
      achievements: {
        badgeCount: user.badges.length,
        levelProgress: {
          currentLevel: user.level,
          pointsForCurrentLevel: (user.level - 1) * 200,
          pointsForNextLevel: user.level * 200,
          progressPercentage: Math.min(100, ((user.points - (user.level - 1) * 200) / 200) * 100)
        }
      }
    };

    console.log('✅ User stats calculated for:', user.username);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error fetching user statistics' });
  }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    console.log('📬 Getting notifications for user:', req.user.id);

    const user = await User.findById(req.user.id).select('notifications');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Sort notifications by creation date (newest first)
    const notifications = user.notifications || [];
    const sortedNotifications = notifications.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log(`✅ Found ${sortedNotifications.length} notifications`);

    res.json({
      success: true,
      notifications: sortedNotifications,
      unreadCount: notifications.filter(n => !n.read).length
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    console.log('📖 Marking notification as read:', req.params.notificationId);

    const userId = req.user.id;
    const notificationId = req.params.notificationId;

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        'notifications._id': notificationId
      },
      {
        $set: { 'notifications.$.read': true }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    console.log('✅ Notification marked as read');

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📖 Marking all notifications as read for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mark all unread notifications as read
    const unreadCount = user.notifications.filter(n => !n.read).length;

    user.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
      }
    });

    await user.save();
    console.log(`✅ ${unreadCount} notifications marked as read`);

    res.json({
      success: true,
      message: `${unreadCount} notifications marked as read`,
      markedCount: unreadCount
    });

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    console.log('🗑️ Deleting notification:', notificationId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notificationIndex = user.notifications.findIndex(n => n._id.toString() === notificationId);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    user.notifications.splice(notificationIndex, 1);
    await user.save();
    console.log('✅ Notification deleted successfully');

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🧹 Clearing all notifications for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const deletedCount = user.notifications.length;
    user.notifications = [];
    await user.save();
    console.log(`✅ ${deletedCount} notifications cleared`);

    res.json({
      success: true,
      message: `${deletedCount} notifications cleared`,
      deletedCount
    });

  } catch (error) {
    console.error('❌ Error clearing all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications',
      error: error.message
    });
  }
};

// Create system notification (for achievements, level ups, etc.)
const createSystemNotification = async (userId, notificationData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found for system notification:', userId);
      return false;
    }

    const notification = {
      type: notificationData.type || 'system',
      fromUsername: 'System',
      title: notificationData.title,
      message: notificationData.message,
      description: notificationData.description,
      emoji: notificationData.emoji || '🔔',
      priority: notificationData.priority || 'medium',
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      metadata: notificationData.metadata,
      createdAt: new Date()
    };

    user.notifications.unshift(notification); // Add to beginning

    // Keep only last 50 notifications to prevent bloat
    if (user.notifications.length > 50) {
      user.notifications = user.notifications.slice(0, 50);
    }

    await user.save();
    console.log(`✅ System notification created for user ${userId}: ${notification.title}`);
    return true;

  } catch (error) {
    console.error('❌ Error creating system notification:', error);
    return false;
  }
};

// Get user profile by ID (for viewing other users' profiles)
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('👤 Getting user profile for:', userId);

    const user = await User.findById(userId).select('-password -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's habits
    const habits = await require('../models/Habit').find({ userId: userId });

    // Calculate user statistics
    const totalHabits = habits.length;
    const completedHabits = habits.filter(h => h.isCompletedToday).length;
    const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    // Get habit categories
    const categories = [...new Set(habits.map(h => h.category).filter(Boolean))];

    // Calculate streak information
    const streaks = habits.map(h => h.streak || 0);
    const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const avgStreak = streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0;

    const profileData = {
      id: user._id,
      username: user.username,
      level: user.level || 1,
      points: user.points || 0,
      streak: user.streak || 0,
      timezone: user.timezone || 'UTC',
      stats: {
        totalHabits,
        completedHabits,
        completionRate,
        maxStreak,
        avgStreak,
        categories: categories.length
      },
      habits: habits.map(h => ({
        id: h._id,
        title: h.title,
        category: h.category,
        difficulty: h.difficulty,
        frequency: h.frequency,
        streak: h.streak || 0,
        isCompletedToday: h.isCompletedToday || false
      })),
      categories
    };

    console.log('✅ User profile retrieved successfully');

    res.json({
      success: true,
      user: profileData
    });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,        // Admin
  deleteUserById,     // Admin
  getUserStats,       // Profile statistics
  validateUsername,   // Helper function for username validation
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  createSystemNotification,
  getUserProfile      // Get user profile by ID
};
