const Admin = require('../models/Admin');
const User = require('../models/User');
const Habit = require('../models/Habit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateUsername } = require('./userController');

const JWT_SECRET = process.env.JWT_SECRET ;

// Register new admin
const registerAdmin = async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const {username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({
        message: usernameValidation.message,
        field: 'username'
      });
    }

    let admin = await Admin.findOne({ email });
    if (admin) return res.status(400).json({ message: 'Admin already exists' });

    // Check if username is already taken
    const existingUsername = await Admin.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username is already taken',
        field: 'username'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new Admin({ username: username.trim(), email, password: hashedPassword });
    await admin.save();

    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      }
    });
  } catch (error) {
    console.error('Error registering admin:', error.message); // show only the message
    res.status(500).json({ message: "Server error registering admin" });
  }
};


// Admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      }
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ message: 'Server error logging in admin' });
  }
};

// Get admin info
const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ message: 'Server error fetching admin' });
  }
};

// Update admin info
const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    Object.assign(admin, req.body);
    await admin.save();

    res.json({
      id: admin._id,
      username: admin.username,
      email: admin.email,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ message: 'Server error updating admin' });
  }
};

// Delete admin account
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ message: 'Server error deleting admin' });
  }
};

// Get admin statistics
const getAdminStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();

    // Get admin users
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Get active users (users with at least one habit)
    const usersWithHabits = await Habit.distinct('user');
    const activeUsers = usersWithHabits.length;

    // Get total habits
    const totalHabits = await Habit.countDocuments();

    // Get total completions (sum of all completed dates)
    const habits = await Habit.find({});
    const totalCompletions = habits.reduce((total, habit) => total + habit.completedDates.length, 0);

    // Calculate averages
    const avgHabitsPerUser = totalUsers > 0 ? (totalHabits / totalUsers).toFixed(1) : 0;
    const avgCompletionRate = totalHabits > 0 ? ((totalCompletions / totalHabits) * 100).toFixed(1) : 0;

    // Get average XP
    const users = await User.find({});
    const totalXP = users.reduce((total, user) => total + (user.points || 0), 0);
    const avgXP = totalUsers > 0 ? (totalXP / totalUsers).toFixed(0) : 0;

    const stats = {
      totalUsers,
      activeUsers,
      adminUsers,
      totalHabits,
      totalCompletions,
      avgHabitsPerUser: parseFloat(avgHabitsPerUser),
      avgCompletionRate: parseFloat(avgCompletionRate),
      avgXP: parseInt(avgXP)
    };

    console.log('✅ Admin stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Server error getting admin stats' });
  }
};

// Get all users for admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Server error getting users' });
  }
};

// Get all habits for admin
const getAllHabits = async (req, res) => {
  try {
    const habits = await Habit.find({}).populate('user', 'username email').sort({ createdAt: -1 });
    res.json(habits);
  } catch (error) {
    console.error('Error getting all habits:', error);
    res.status(500).json({ message: 'Server error getting habits' });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminStats,
  getAllUsers,
  getAllHabits,
};
