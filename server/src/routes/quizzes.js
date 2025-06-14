const express = require('express');
const { Quiz, QuizSubmission, QuizResult } = require('../models/Quiz');
const { auth, checkRole } = require('../middleware/auth');
const BadgeService = require('../services/badgeService');

const router = express.Router();

// Get all quizzes (public)
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'username')
      .sort('-createdAt');
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).send();
  }
});

// Get all quiz results (admin/lecturer only)
router.get('/all-results', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    // Get all quiz results
    const results = await QuizResult.find()
      .sort('-submittedAt')
      .populate('userId', 'username email'); // Populate user information
    
    // Format the results to include username
    const formattedResults = results.map(result => {
      return {
        ...result.toObject(),
        username: result.userId ? result.userId.username : 'Unknown User'
      };
    });
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching all quiz results:', error);
    res.status(500).send();
  }
});

// Get a single quiz by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ id: req.params.id })
      .populate('createdBy', 'username');
    
    if (!quiz) {
      return res.status(404).send();
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).send();
  }
});

// Create a new quiz (lecturer/admin only)
router.post('/', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    // Generate a URL-safe ID from the title if not provided
    if (!req.body.id) {
      req.body.id = `quiz-${Date.now().toString(36)}`;
    }
    
    // Validate that quiz has exactly 100 points
    if (req.body.questions && req.body.questions.length > 0) {
      const totalPoints = req.body.questions.reduce((sum, question) => {
        return sum + (question.points || 1);
      }, 0);
      
      if (totalPoints !== 100) {
        return res.status(400).json({ 
          message: `Quiz must have exactly 100 points total. Current total: ${totalPoints}` 
        });
      }
      
      // Validate individual question points
      for (const question of req.body.questions) {
        const points = question.points || 1;
        if (points <= 0 || !Number.isInteger(points)) {
          return res.status(400).json({ 
            message: `Question "${question.text}" has invalid points. Points must be positive integers.` 
          });
        }
      }
    }
    
    const quiz = new Quiz({
      ...req.body,
      createdBy: req.user._id
    });
    
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a quiz (lecturer/admin only)
router.put('/:id', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    // Find by quiz ID (not MongoDB _id)
    const quiz = await Quiz.findOne({ id: req.params.id });
    
    if (!quiz) {
      return res.status(404).send();
    }
    
    // Validate that quiz has exactly 100 points
    if (req.body.questions && req.body.questions.length > 0) {
      const totalPoints = req.body.questions.reduce((sum, question) => {
        return sum + (question.points || 1);
      }, 0);
      
      if (totalPoints !== 100) {
        return res.status(400).json({ 
          message: `Quiz must have exactly 100 points total. Current total: ${totalPoints}` 
        });
      }
      
      // Validate individual question points
      for (const question of req.body.questions) {
        const points = question.points || 1;
        if (points <= 0 || !Number.isInteger(points)) {
          return res.status(400).json({ 
            message: `Question "${question.text}" has invalid points. Points must be positive integers.` 
          });
        }
      }
    }
    
    // Update the updatedAt timestamp
    req.body.updatedAt = Date.now();
    
    // Update the quiz
    Object.assign(quiz, req.body);
    await quiz.save();
    
    res.json(quiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete a quiz (lecturer/admin only)
router.delete('/:id', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const result = await Quiz.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).send();
    }
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).send();
  }
});

// Start a quiz attempt
router.post('/quiz-attempts/start', auth, async (req, res) => {
  try {
    const { quizId } = req.body;
    
    // Validate quiz exists
    const quiz = await Quiz.findOne({ id: quizId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Create a new quiz attempt
    const submission = new QuizSubmission({
      quizId,
      userId: req.user._id,
      answers: [],
      completed: false,
      startedAt: new Date()
    });
    
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    console.error('Error starting quiz attempt:', error);
    res.status(400).json({ message: error.message });
  }
});

// Submit a quiz
router.post('/quiz-submissions', auth, async (req, res) => {
  try {
    const { quizId, answers, score, earnedPoints, totalPoints } = req.body;
    
    // Validate quiz exists
    const quiz = await Quiz.findOne({ id: quizId });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Find existing submission or create new one
    let submission = await QuizSubmission.findOne({ 
      quizId,
      userId: req.user._id,
      completed: false
    });
    
    if (!submission) {
      submission = new QuizSubmission({
        quizId,
        userId: req.user._id,
        answers: [],
        startedAt: new Date()
      });
    }
    
    // Update submission with answers and completion info
    submission.answers = answers;
    submission.score = score;
    submission.completed = true;
    submission.submittedAt = new Date();
    
    await submission.save();
    
    // Create quiz result with points information
    const result = new QuizResult({
      quizId,
      userId: req.user._id,
      score,
      totalQuestions: quiz.questions.length,
      totalPoints: totalPoints || 100,
      earnedPoints: earnedPoints || 0,
      submittedAt: new Date()
    });
    
    await result.save();
    
    // Check for new badges after quiz completion
    try {
      await BadgeService.checkAndAwardBadges(req.user._id);
    } catch (badgeError) {
      console.error('Error checking badges:', badgeError);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get quiz results for a user
router.get('/users/:userId/quiz-results', auth, async (req, res) => {
  try {
    // Ensure user can only access their own results unless admin or lecturer
    if (req.params.userId !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'lecturer') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const results = await QuizResult.find({ userId: req.params.userId })
      .sort('-submittedAt');
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).send();
  }
});

// Get quiz attempts for a user
router.get('/users/:userId/quiz-attempts', auth, async (req, res) => {
  try {
    // Ensure user can only access their own attempts unless admin or lecturer
    if (req.params.userId !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'lecturer') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const query = { userId: req.params.userId };
    
    // Optional quizId filter
    if (req.query.quizId) {
      query.quizId = req.query.quizId;
    }
    
    const attempts = await QuizSubmission.find(query)
      .sort('-startedAt');
    
    res.json(attempts);
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).send();
  }
});

module.exports = router; 