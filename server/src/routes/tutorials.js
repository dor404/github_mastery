const express = require('express');
const Tutorial = require('../models/Tutorial');
const TutorialProgress = require('../models/TutorialProgress');
const { auth, checkRole } = require('../middleware/auth');
const auditLogger = require('../utils/auditLogger');
const BadgeService = require('../services/badgeService');

const router = express.Router();

// Get all published tutorials (public)
router.get('/published', async (req, res) => {
  try {
    const tutorials = await Tutorial.find({ published: true })
      .populate('author', 'username')
      .select('-content')
      .sort('-createdAt');
    res.json(tutorials);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutorials', error: error.message });
  }
});

// Get a single published tutorial by ID (public)
router.get('/published/:id', async (req, res) => {
  try {
    const tutorial = await Tutorial.findOne({ _id: req.params.id, published: true })
      .populate('author', 'username')
      .populate('prerequisites', 'title');
    
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }
    
    res.json(tutorial);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutorial', error: error.message });
  }
});

// Search tutorials (public) - MOVED UP to prevent conflict with /:id route
router.get('/search', async (req, res) => {
  try {
    console.log('Received search request with query params:', req.query);
    const { query, difficulty, tags, filterMode } = req.query;
    const searchQuery = { published: true };
    
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    if (difficulty) {
      searchQuery.difficulty = difficulty;
    }
    
    if (tags) {
      // Process tags parameter
      let tagArray;
      if (Array.isArray(tags)) {
        tagArray = tags;
      } else if (typeof tags === 'string') {
        // Handle comma-separated tags string
        tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }
      
      // Apply tag filter according to the specified mode
      if (tagArray && tagArray.length > 0) {
        console.log('Filtering by tags:', tagArray, 'with mode:', filterMode);
        // Check if filterMode is specified
        if (filterMode && filterMode.toUpperCase() === 'OR') {
          // OR logic - match tutorials with ANY of the selected tags
          searchQuery.tags = { $in: tagArray };
          console.log('Using OR logic for tags');
        } else {
          // Default to AND logic - match tutorials with ALL selected tags
          searchQuery.tags = { $all: tagArray };
          console.log('Using AND logic for tags');
        }
      }
    }
    
    console.log('Final search query:', JSON.stringify(searchQuery, null, 2));
    
    const tutorials = await Tutorial.find(searchQuery)
      .populate('author', 'username')
      .select('-content')
      .sort('-createdAt');
    
    console.log(`Search found ${tutorials.length} matching tutorials`);
    
    res.json(tutorials);
  } catch (error) {
    console.error('Error searching tutorials:', error);
    res.status(500).json({ message: 'Error searching tutorials', error: error.message });
  }
});

// Get tutorials by author (lecturer/admin only)
router.get('/author/:authorId', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const tutorials = await Tutorial.find({ author: req.params.authorId })
      .populate('author', 'username')
      .sort('-createdAt');
    res.json(tutorials);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutorials', error: error.message });
  }
});

// Get draft tutorials (unpublished) for the current user or all if admin
router.get('/drafts', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    let searchQuery = { published: false };
    
    // If not admin, only show user's own drafts
    if (req.user.role !== 'admin') {
      searchQuery.author = req.user._id;
    }
    
    const drafts = await Tutorial.find(searchQuery)
      .populate('author', 'username')
      .select('-content') // Exclude content for list view
      .sort('-updatedAt'); // Sort by most recently updated
      
    res.json(drafts);
  } catch (error) {
    console.error('Error fetching draft tutorials:', error);
    res.status(500).json({ message: 'Error fetching draft tutorials', error: error.message });
  }
});

// Get a single tutorial by ID (authenticated, for editing/deleting)
router.get('/:id', auth, async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id)
      .populate('author', 'username')
      .populate('prerequisites', 'title');
    
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }
    
    // Check if user is author or admin
    const authorId = typeof tutorial.author === 'object' ? tutorial.author._id : tutorial.author;
    if (authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this tutorial' });
    }
    
    res.json(tutorial);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutorial', error: error.message });
  }
});

// Create a new tutorial (lecturer/admin only)
router.post('/', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const tutorial = new Tutorial({
      ...req.body,
      author: req.user._id
    });
    
    await tutorial.save();
    res.status(201).json(tutorial);
  } catch (error) {
    res.status(400).json({ message: 'Error creating tutorial', error: error.message });
  }
});

// Update a tutorial (author/admin only)
router.patch('/:id', auth, async (req, res) => {
  try {
    // First check authorization
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Check if user is author or admin
    const authorId = tutorial.author.toString();
    if (authorId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this tutorial' });
    }

    // Validate difficulty if it's being updated
    if (req.body.difficulty && !['beginner', 'elementary', 'intermediate', 'advanced', 'expert'].includes(req.body.difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty level' });
    }

    // Prepare update object
    const updates = { ...req.body };
    
    // Increment version if content is being updated
    if (updates.content) {
      updates.version = (tutorial.version || 0) + 1;
    }

    // Update the tutorial
    const updatedTutorial = await Tutorial.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { 
        new: true,
        runValidators: true
      }
    ).populate('author', 'username').populate('prerequisites', 'title');

    if (!updatedTutorial) {
      return res.status(404).json({ message: 'Tutorial not found after update' });
    }

    res.json(updatedTutorial);
  } catch (error) {
    console.error('Error updating tutorial:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Title already exists' });
    }
    
    res.status(500).json({ 
      message: 'Error updating tutorial', 
      error: error.message 
    });
  }
});

// Delete a tutorial (lecturer/admin only)
router.delete('/:id', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    
    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }
    
    await Tutorial.deleteOne({ _id: req.params.id });
    
    // Log the deletion action to audit log
    auditLogger.log({
      action: 'delete',
      resourceType: 'tutorial',
      resourceId: req.params.id,
      user: req.user,
      details: {
        title: tutorial.title,
        authorId: tutorial.author.toString()
      }
    });
    
    res.json({ message: 'Tutorial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tutorial', error: error.message });
  }
});

// Get tutorial progress for current user
router.get('/progress', auth, async (req, res) => {
  try {
    const progressRecords = await TutorialProgress.find({ userId: req.user._id })
      .populate('tutorialId', 'title')
      .lean();
    
    // Convert to the format expected by the frontend
    const progressMap = {};
    progressRecords.forEach(record => {
      if (record.tutorialId) {
        progressMap[record.tutorialId._id] = {
          status: record.status,
          currentPage: record.currentPage,
          totalPages: record.totalPages,
          progress: record.status === 'completed' ? 100 : 
                   record.totalPages > 0 ? Math.round((record.currentPage / record.totalPages) * 100) : 0
        };
      }
    });
    
    res.json(progressMap);
  } catch (error) {
    console.error('Error fetching tutorial progress:', error);
    res.status(500).json({ message: 'Error fetching tutorial progress', error: error.message });
  }
});

// Update or create tutorial progress
router.post('/progress/:tutorialId', auth, async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const { status, currentPage = 0, totalPages = 0 } = req.body;
    const userId = req.user.id;

    console.log(`Updating tutorial progress - User: ${userId}, Tutorial: ${tutorialId}, Status: ${status}, Page: ${currentPage}/${totalPages}`);

    // Validate tutorial exists
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) {
      console.log(`Tutorial not found: ${tutorialId}`);
      return res.status(404).json({ error: 'Tutorial not found' });
    }

    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      console.log(`Invalid status provided: ${status}`);
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update or create progress record
    const progressData = {
      userId,
      tutorialId,
      status,
      currentPage: Math.max(0, currentPage),
      totalPages: Math.max(0, totalPages),
      lastAccessed: new Date()
    };

    const updatedProgress = await TutorialProgress.findOneAndUpdate(
      { userId, tutorialId },
      progressData,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`Tutorial progress updated successfully:`, {
      userId,
      tutorialId,
      status: updatedProgress.status,
      currentPage: updatedProgress.currentPage,
      totalPages: updatedProgress.totalPages
    });

    // Check for new badges if tutorial was completed
    if (updatedProgress.status === 'completed') {
      try {
        await BadgeService.checkAndAwardBadges(userId);
      } catch (badgeError) {
        console.error('Error checking badges:', badgeError);
      }
    }

    res.json({
      success: true,
      progress: updatedProgress
    });

  } catch (error) {
    console.error('Error updating tutorial progress:', error);
    res.status(500).json({ 
      error: 'Failed to update tutorial progress',
      details: error.message 
    });
  }
});

module.exports = router; 