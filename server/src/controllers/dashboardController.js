const Progress = require('../models/Progress');
const Exercise = require('../models/Exercise');
const { Quiz, QuizResult } = require('../models/Quiz');
const Tutorial = require('../models/Tutorial');

function getUserProgress(req, res) {
  try {
    console.log('Dashboard - User ID:', req.user._id);

    // Get all exercises, tutorials, and user's quiz results
    Promise.all([
      Exercise.find().lean(),
      Tutorial.find().lean(),
      Quiz.find().lean(),
      QuizResult.find({ userId: req.user._id }).lean().sort('-submittedAt'),
      Progress.find({ userId: req.user._id }).lean()
    ]).then(([exercises, tutorials, quizzes, quizResults, progress]) => {
      console.log('Dashboard - Found exercises:', exercises?.length || 0);
      console.log('Dashboard - Found tutorials:', tutorials?.length || 0);
      console.log('Dashboard - Found quizzes:', quizzes?.length || 0);
      console.log('Dashboard - Found quiz results:', quizResults?.length || 0);
      console.log('Dashboard - User progress records:', progress?.length || 0);

      // Calculate completed modules (exercises and tutorials)
      const completedModules = progress.filter(p => p.completed).length;
      const totalModules = exercises?.length || 0; // Only count exercises

      // Get quiz scores with dates from QuizResult
      const quizScores = quizResults.map(result => ({
        date: result.submittedAt.toISOString().split('T')[0],
        score: (result.earnedPoints / result.totalPoints) * 100 // Convert to percentage
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log('Dashboard - Quiz scores:', quizScores);

      // Get incomplete exercises only
      const completedIds = progress.filter(p => p.completed).map(p => p.exerciseId);
      const incompleteModules = exercises
        .filter(exercise => !completedIds.includes(exercise.id))
        .map(exercise => ({
          id: exercise.id,
          title: exercise.title,
          type: 'exercise'
        }));

      const responseData = {
        completedModules,
        totalModules,
        quizScores,
        incompleteModules
      };

      console.log('Dashboard - Sending response:', JSON.stringify(responseData, null, 2));
      res.json(responseData);
    }).catch(error => {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    });
  } catch (error) {
    console.error('Error in getUserProgress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = getUserProgress; 