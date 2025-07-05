const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const {
  findPotentialPartners,
  sendPartnerRequest,
  acceptPartnerRequest,
  getUserPartnerships,
  endPartnership
} = require('../Controllers/simplifiedPartnerController');

// All routes require authentication
router.use(authMiddleware);

// Find potential partners
router.get('/find', findPotentialPartners);

// Send partnership request
router.post('/request', sendPartnerRequest);

// Accept partnership request
router.post('/accept', acceptPartnerRequest);

// Get user's partnerships and requests
router.get('/my-partnerships', getUserPartnerships);

// End partnership
router.post('/end', endPartnership);

module.exports = router;
