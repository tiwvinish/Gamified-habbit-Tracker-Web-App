const express = require('express');
const router = express.Router();

const {
  getAllSuggestions,
  getSuggestionById,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion,
  checkSuggestionExists,
  getSuggestionsFiltered,
  removeDuplicates,
} = require('../Controllers/suggestionController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', getAllSuggestions);
router.get('/filtered', getSuggestionsFiltered); // Must come before /:id
router.get('/check/:title', checkSuggestionExists); // Check if suggestion exists (public)
router.get('/:id', getSuggestionById);

// Protected routes (require authentication)
router.post('/', createSuggestion); // Make this public for testing, or add auth later
router.put('/:id', authMiddleware, updateSuggestion);
router.delete('/:id', authMiddleware, deleteSuggestion);

// Admin routes
router.delete('/admin/duplicates', authMiddleware, adminMiddleware, removeDuplicates);

module.exports = router;
