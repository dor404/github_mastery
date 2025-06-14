const express = require('express');
const router = express.Router();
const getUserProgress = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

// Get user's dashboard data
router.get('/progress', auth, function(req, res) {
  getUserProgress(req, res);
});

module.exports = router; 