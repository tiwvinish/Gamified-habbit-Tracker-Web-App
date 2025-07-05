const HabitSuggestion = require('../models/HabitSuggestion');

// Get all habit suggestions
const getAllSuggestions = async (req, res) => {
  try {
    const suggestions = await HabitSuggestion.find();
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching habit suggestions:', error);
    res.status(500).json({ message: 'Server error fetching habit suggestions' });
  }
};

// Get suggestion by ID
const getSuggestionById = async (req, res) => {
  try {
    const suggestion = await HabitSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });
    res.json(suggestion);
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    res.status(500).json({ message: 'Server error fetching suggestion' });
  }
};

// Create new habit suggestion
const createSuggestion = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty = 'easy',
      xpReward = 25,
      icon = '🎯',
      tips = [],
      frequency = 'daily',
      estimatedTime = '5-10 minutes'
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        message: 'Title, description, and category are required'
      });
    }

    // Use findOrCreate to prevent duplicates
    const { habit, created } = await HabitSuggestion.findOrCreate({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      difficulty,
      xpReward,
      icon,
      tips,
      frequency,
      estimatedTime
    });

    if (created) {
      console.log(`✅ Created new habit suggestion: ${habit.title}`);
      res.status(201).json({
        message: 'Habit suggestion created successfully',
        suggestion: habit,
        created: true
      });
    } else {
      console.log(`⚠️ Habit suggestion already exists: ${habit.title}`);
      res.status(200).json({
        message: 'Habit suggestion already exists',
        suggestion: habit,
        created: false
      });
    }
  } catch (error) {
    console.error('Error creating suggestion:', error);

    if (error.code === 11000) {
      // Duplicate key error
      res.status(409).json({
        message: 'A habit suggestion with this title already exists',
        error: 'DUPLICATE_TITLE'
      });
    } else if (error.name === 'ValidationError') {
      // Validation error
      res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    } else {
      res.status(500).json({
        message: 'Server error creating suggestion'
      });
    }
  }
};

// Update habit suggestion
const updateSuggestion = async (req, res) => {
  try {
    const suggestion = await HabitSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    Object.assign(suggestion, req.body);
    await suggestion.save();
    res.json(suggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ message: 'Server error updating suggestion' });
  }
};

// Delete habit suggestion
const deleteSuggestion = async (req, res) => {
  try {
    const suggestion = await HabitSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    await suggestion.remove();
    res.json({ message: 'Suggestion deleted' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ message: 'Server error deleting suggestion' });
  }
};

// Check if habit suggestion exists by title
const checkSuggestionExists = async (req, res) => {
  try {
    const { title } = req.params;

    const suggestion = await HabitSuggestion.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });

    res.json({
      exists: !!suggestion,
      suggestion: suggestion || null
    });
  } catch (error) {
    console.error('Error checking suggestion:', error);
    res.status(500).json({ message: 'Server error checking suggestion' });
  }
};

// Get suggestions with filtering and search
const getSuggestionsFiltered = async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search,
      limit = 50,
      page = 1,
      sortBy = 'popularityScore',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const suggestions = await HabitSuggestion
      .find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await HabitSuggestion.countDocuments(filter);

    res.json({
      suggestions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching filtered suggestions:', error);
    res.status(500).json({ message: 'Server error fetching suggestions' });
  }
};

// Remove duplicate suggestions (admin function)
const removeDuplicates = async (req, res) => {
  try {
    console.log('🔍 Checking for duplicate habit suggestions...');

    const duplicates = await HabitSuggestion.aggregate([
      {
        $group: {
          _id: { $toLower: "$title" },
          count: { $sum: 1 },
          docs: { $push: "$$ROOT" }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    let removedCount = 0;

    for (const duplicate of duplicates) {
      // Keep the first one (usually the oldest), remove the rest
      const docsToRemove = duplicate.docs.slice(1);

      for (const doc of docsToRemove) {
        await HabitSuggestion.findByIdAndDelete(doc._id);
        console.log(`🗑️ Removed duplicate: ${doc.title}`);
        removedCount++;
      }
    }

    console.log(`✅ Removed ${removedCount} duplicate suggestions`);

    res.json({
      message: `Successfully removed ${removedCount} duplicate suggestions`,
      duplicatesFound: duplicates.length,
      duplicatesRemoved: removedCount
    });
  } catch (error) {
    console.error('Error removing duplicates:', error);
    res.status(500).json({ message: 'Server error removing duplicates' });
  }
};

module.exports = {
  getAllSuggestions,
  getSuggestionById,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion,
  checkSuggestionExists,
  getSuggestionsFiltered,
  removeDuplicates,
};
