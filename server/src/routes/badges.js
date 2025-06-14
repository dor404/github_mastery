const express = require('express');
const { auth } = require('../middleware/auth');
const BadgeService = require('../services/badgeService');

const router = express.Router();

// Get user's earned badges
router.get('/my-badges', auth, async (req, res) => {
  try {
    const badges = await BadgeService.getUserBadges(req.user._id);
    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Get all badges with user's progress
router.get('/all-badges', auth, async (req, res) => {
  try {
    const badges = await BadgeService.getAllBadgesWithProgress(req.user._id);
    res.json(badges);
  } catch (error) {
    console.error('Error fetching all badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Check and award new badges (can be called after completion events)
router.post('/check-badges', auth, async (req, res) => {
  try {
    const newBadges = await BadgeService.checkAndAwardBadges(req.user._id);
    res.json({ 
      message: 'Badges checked successfully',
      newBadges: newBadges
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    res.status(500).json({ error: 'Failed to check badges' });
  }
});

// Get user's achievements summary for profile
router.get('/achievements', auth, async (req, res) => {
  try {
    const [earnedBadges, userStats] = await Promise.all([
      BadgeService.getUserBadges(req.user._id),
      BadgeService.getUserStats(req.user._id)
    ]);

    const achievementSummary = {
      totalBadges: earnedBadges.length,
      badges: earnedBadges,
      stats: userStats,
      recentBadges: earnedBadges.slice(0, 5) // Last 5 badges earned
    };

    res.json(achievementSummary);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Debug route to force badge initialization
router.post('/debug/init', auth, async (req, res) => {
  try {
    console.log('=== FORCE BADGE INITIALIZATION ===');
    
    // First, completely reset the badges collection
    const Badge = require('../models/Badge').Badge;
    const UserBadge = require('../models/Badge').UserBadge;
    
    console.log('Dropping badges collection to fix index issues...');
    await Badge.collection.drop().catch(() => {}); // Ignore error if collection doesn't exist
    await UserBadge.collection.drop().catch(() => {}); // Also reset user badges
    
    console.log('Recreating badges collection...');
    await BadgeService.initializeDefaultBadges();
    
    // Verify initialization worked
    const badgeCount = await Badge.countDocuments();
    console.log(`Verification: ${badgeCount} badges now in database`);
    
    res.json({ 
      message: 'Badge initialization completed',
      badgesInDatabase: badgeCount,
      success: badgeCount >= 18
    });
  } catch (error) {
    console.error('Error initializing badges:', error);
    res.status(500).json({ error: 'Failed to initialize badges', details: error.message });
  }
});

// Debug route to force badge check
router.post('/debug/force-check', auth, async (req, res) => {
  try {
    console.log('=== FORCE BADGE CHECK ===');
    const newBadges = await BadgeService.checkAndAwardBadges(req.user._id);
    const userStats = await BadgeService.getUserStats(req.user._id);
    
    res.json({ 
      message: 'Badge check completed',
      newBadges: newBadges,
      userStats: userStats
    });
  } catch (error) {
    console.error('Error in force badge check:', error);
    res.status(500).json({ error: 'Failed to check badges' });
  }
});

module.exports = router; 