const express = require('express');
const { auth, checkRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { Quiz, QuizResult } = require('../models/Quiz');
const Tutorial = require('../models/Tutorial');
const TutorialProgress = require('../models/TutorialProgress');
const Exercise = require('../models/Exercise');

const router = express.Router();

// Get class monitoring data for lecturers
router.get('/class-monitoring', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const [students, progressRecords, quizResults, publishedTutorials, totalQuizzes] = await Promise.all([
      User.find({ role: 'student' }).lean(),
      Progress.find().populate('exerciseId', 'title').lean(),
      QuizResult.find().populate(['userId', 'quizId']).lean(),
      Tutorial.find({ published: true }).select('_id title').lean(),
      Quiz.countDocuments()
    ]);

    console.log(`Found ${publishedTutorials.length} published tutorials`);
    console.log(`Found ${students.length} students`);
    console.log(`Found ${totalQuizzes} total quizzes`);

    const studentData = await Promise.all(students.map(async (student) => {
      // Get student's exercise progress
      const studentProgress = progressRecords.filter(
        progress => progress.userId.toString() === student._id.toString()
      );

      // Get student's quiz results  
      const studentQuizResults = quizResults.filter(
        result => {
          // Handle both populated and non-populated userId
          const resultUserId = result.userId?._id || result.userId;
          return resultUserId?.toString() === student._id.toString();
        }
      );

      // Count unique quizzes completed by this student
      const uniqueQuizIds = new Set(
        studentQuizResults
          .filter(result => result.quizId)
          .map(result => {
            // Handle both populated objects and direct string IDs
            return result.quizId._id ? result.quizId._id.toString() : result.quizId.toString();
          })
      );
      const completedQuizzes = uniqueQuizIds.size;

      // Get student's tutorial progress
      const tutorialProgress = await TutorialProgress.find({ 
        userId: student._id 
      }).lean();

      // Count completed tutorials
      const completedTutorials = tutorialProgress.filter(tp => tp.status === 'completed').length;

      // Calculate completion rate (exercises + tutorials)
      const completedExercises = studentProgress.filter(p => p.completed === true).length;
      const totalExercises = await Exercise.countDocuments();
      const totalModules = totalExercises + publishedTutorials.length;
      const completedModules = completedExercises + completedTutorials;
      
      const completionRate = totalModules > 0 ? 
        Math.round((completedModules / totalModules) * 100) : 0;

      // Calculate quiz average
      const quizAverage = studentQuizResults.length > 0 ? 
        Math.round(studentQuizResults.reduce((sum, result) => sum + result.score, 0) / studentQuizResults.length) : null;

      // Detailed logging for debugging
      console.log(`\n=== STUDENT: ${student.username} ===`);
      console.log(`Raw progress records:`, studentProgress.map(p => ({
        exerciseId: p.exerciseId, 
        completed: p.completed,
        progress: p.progress
      })));
      console.log(`Raw quiz results:`, studentQuizResults.map(q => ({
        quizId: q.quizId,
        score: q.score,
        userId: q.userId
      })));
      console.log(`Raw tutorial progress:`, tutorialProgress.map(tp => ({
        tutorialId: tp.tutorialId,
        status: tp.status,
        currentPage: tp.currentPage,
        totalPages: tp.totalPages
      })));
      console.log(`Exercises: ${completedExercises}/${totalExercises} (Progress records: ${studentProgress.length})`);
      console.log(`Tutorials: ${completedTutorials}/${publishedTutorials.length} (Tutorial progress records: ${tutorialProgress.length})`);
      console.log(`Quizzes: ${completedQuizzes}/${totalQuizzes} (Quiz results: ${studentQuizResults.length})`);
      console.log(`Quiz Average: ${quizAverage}% (from ${studentQuizResults.length} attempts)`);
      console.log(`Overall Completion: ${completionRate}%`);
      console.log(`================================\n`);

      return {
        _id: student._id,
        username: student.username,
        email: student.email,
        joinedAt: student.createdAt,
        completionRate,
        exerciseProgress: `${completedExercises}/${totalExercises}`,
        tutorialProgress: `${completedTutorials}/${publishedTutorials.length}`,
        quizProgress: `${completedQuizzes}/${totalQuizzes}`,
        quizAverage: quizAverage !== null ? quizAverage : null,
        quizCount: studentQuizResults.length,
        needsHelp: completionRate < 50 || (quizAverage !== null && quizAverage < 60)
      };
    }));

    // Calculate summary statistics
    const totalStudents = studentData.length;
    const averageCompletion = totalStudents > 0 ? 
      Math.round(studentData.reduce((sum, student) => sum + student.completionRate, 0) / totalStudents) : 0;
    
    const studentsWithQuizzes = studentData.filter(s => s.quizAverage !== null);
    const averageQuizScore = studentsWithQuizzes.length > 0 ? 
      Math.round(studentsWithQuizzes.reduce((sum, student) => sum + student.quizAverage, 0) / studentsWithQuizzes.length) : null;
    
    const studentsNeedingHelp = studentData.filter(s => s.needsHelp).length;

    res.json({
      summary: {
        totalStudents,
        averageCompletion,
        averageQuizScore,
        studentsNeedingHelp,
        totalExercises: await Exercise.countDocuments(),
        totalTutorials: publishedTutorials.length
      },
      students: studentData
    });
  } catch (error) {
    console.error('Error fetching class monitoring data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs
router.get('/audit-logs', auth, checkRole('admin'), async (req, res) => {
  try {
    const logPath = path.join(__dirname, '../../logs/audit.log');
    
    // Check if logs file exists
    if (!fs.existsSync(logPath)) {
      return res.json({ logs: [] });
    }
    
    // Read log file
    const logContent = fs.readFileSync(logPath, 'utf8');
    const logLines = logContent.trim().split('\n');
    
    // Parse log entries
    const logs = logLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { error: 'Invalid log entry', raw: line };
      }
    });
    
    // Sort logs by timestamp (newest first)
    logs.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Apply pagination if needed
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    res.json({
      logs: paginatedLogs,
      pagination: {
        total: logs.length,
        page,
        limit,
        pages: Math.ceil(logs.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ message: 'Error retrieving audit logs', error: error.message });
  }
});

// Temporary debug endpoint to check tutorial progress for a user
router.get('/debug-user-progress/:username', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user
    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get all progress data for this user
    const [exerciseProgress, tutorialProgress, quizResults] = await Promise.all([
      Progress.find({ userId: user._id }).populate('exerciseId', 'title').lean(),
      TutorialProgress.find({ userId: user._id }).lean(),
      QuizResult.find({ userId: user._id }).lean()
    ]);
    
    res.json({
      user: { _id: user._id, username: user.username },
      exerciseProgress,
      tutorialProgress, 
      quizResults
    });
  } catch (error) {
    console.error('Error fetching user progress debug data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 