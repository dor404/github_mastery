const express = require('express');
const Progress = require('../models/Progress');
const { auth } = require('../middleware/auth');
const Exercise = require('../models/Exercise');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Tutorial = require('../models/Tutorial');
const TutorialProgress = require('../models/TutorialProgress');
const BadgeService = require('../services/badgeService');

const router = express.Router();

// Get all progress for current user
router.get('/', auth, async (req, res) => {
  try {
    const progresses = await Progress.find({ userId: req.user._id }).lean();
    const normalized = progresses.map(item => {
      if (!item.exerciseId && item.moduleId) {
        item.exerciseId = item.moduleId;
      }
      delete item.moduleId;
      return item;
    });
    res.json(normalized);
  } catch (error) {
    res.status(500).send();
  }
});

// Get progress for a specific exercise
router.get('/exercise/:exerciseId', auth, async (req, res) => {
  try {
    const progress = await Progress.findOne({ 
      userId: req.user._id,
      exerciseId: req.params.exerciseId 
    });
    
    if (!progress) {
      return res.json({
        exerciseId: req.params.exerciseId,
        userId: req.user._id,
        completed: false,
        progress: 0,
        tasks: []
      });
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).send();
  }
});

// Get progress for a specific task within an exercise
router.get('/exercise/:exerciseId/task/:taskId', auth, async (req, res) => {
  try {
    const exerciseId = req.params.exerciseId;
    const taskId = req.params.taskId;
    
    const progress = await Progress.findOne({ 
      userId: req.user._id,
      exerciseId 
    });
    
    if (!progress) {
      return res.json({
        exerciseId,
        taskId,
        userId: req.user._id,
        completed: false,
        completedSteps: [],
        startedAt: new Date()
      });
    }
    
    const taskProgress = progress.tasks.find(task => task.taskId === taskId);
    
    if (!taskProgress) {
      return res.json({
        exerciseId,
        taskId,
        userId: req.user._id,
        completed: false,
        completedSteps: [],
        startedAt: new Date()
      });
    }
    
    res.json({
      exerciseId,
      taskId,
      userId: req.user._id,
      completed: taskProgress.completed,
      completedSteps: taskProgress.completedSteps || [],
      startedAt: taskProgress.startedAt,
      completedAt: taskProgress.completedAt
    });
  } catch (error) {
    res.status(500).send();
  }
});

// BACKWARD COMPATIBILITY: Get progress for a specific module (now exercise)
router.get('/module/:moduleId', auth, async (req, res) => {
  try {
    const progress = await Progress.findOne({ 
      userId: req.user._id,
      exerciseId: req.params.moduleId // Use moduleId as exerciseId for backward compatibility
    });
    
    if (!progress) {
      return res.json({
        exerciseId: req.params.moduleId,
        userId: req.user._id,
        completed: false,
        progress: 0,
        tasks: []
      });
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching module progress', error: error.message });
  }
});

// Create or update exercise progress
router.post('/exercise/:exerciseId', auth, async (req, res) => {
  try {
    let { completed, progress, tasks } = req.body;
    const exerciseIdFromParams = req.params.exerciseId;
    
    const completionData = {};
    if (completed) {
      completionData.completedAt = Date.now();
    }
    
    if (progress === 100) {
      completionData.completed = true;
      completionData.completedAt = completionData.completedAt || Date.now();
    }
    
    const sanitizedTasks = Array.isArray(tasks) ? tasks.map(task => ({
      ...task,
      taskId: task.taskId || '',
      completed: !!task.completed,
      completedSteps: Array.isArray(task.completedSteps) ? task.completedSteps : []
    })) : [];
    
    if (req.body.moduleId === null) {
      delete req.body.moduleId;
    }
    
    const existingProgress = await Progress.findOne({
      userId: req.user._id, 
      exerciseId: exerciseIdFromParams
    });
    
    if (existingProgress) {
      const updateFields = {
        lastAccessed: Date.now(),
        ...(typeof progress === 'number' ? { progress } : {}),
        ...(typeof completed === 'boolean' ? { completed } : {}),
        ...(tasks ? { tasks: sanitizedTasks } : {}),
        ...completionData
      };
      
      Object.entries(updateFields).forEach(([key, value]) => {
        existingProgress[key] = value;
      });
      
      await existingProgress.save();
      
      // Check for new badges if exercise was completed
      if (existingProgress.completed) {
        try {
          await BadgeService.checkAndAwardBadges(req.user._id);
        } catch (badgeError) {
          console.error('Error checking badges:', badgeError);
        }
      }
      
      return res.json(existingProgress);
    }
    
    const newProgress = new Progress({
      userId: req.user._id,
      exerciseId: exerciseIdFromParams,
      completed: completed || false,
      progress: progress || 0,
      tasks: sanitizedTasks,
      lastAccessed: Date.now(),
      startedAt: Date.now(),
      ...completionData
    });
    
    await newProgress.save();
    
    // Check for new badges if exercise was completed
    if (newProgress.completed) {
      try {
        await BadgeService.checkAndAwardBadges(req.user._id);
      } catch (badgeError) {
        console.error('Error checking badges:', badgeError);
      }
    }
    
    res.status(201).json(newProgress);
  } catch (error) {
    res.status(400).send();
  }
});

// BACKWARD COMPATIBILITY: Create or update module progress (now exercise progress)
router.post('/module/:moduleId', auth, async (req, res) => {
  try {
    let { completed, progress, tasks } = req.body;
    
    // Set completedAt if explicitly completing
    const completionData = {};
    if (completed) {
      completionData.completedAt = Date.now();
    }
    
    // If progress is 100%, ensure completed is true
    if (progress === 100) {
      completionData.completed = true;
      completionData.completedAt = completionData.completedAt || Date.now();
    }
    
    // Ensure tasks are properly structured to avoid MongoDB query issues
    const sanitizedTasks = Array.isArray(tasks) ? tasks.map(task => {
      return {
        ...task,
        taskId: task.taskId || '',  // Ensure taskId is never null
        completed: !!task.completed, // Ensure boolean
        completedSteps: Array.isArray(task.completedSteps) ? task.completedSteps : []
      };
    }) : [];
    
    // Remove any moduleId field from the request body
    if (req.body.moduleId === null) {
      delete req.body.moduleId;
    }
    
    try {
      // Try using updateOne instead of findOneAndUpdate to avoid MongoDB executor issues
      const result = await Progress.updateOne(
        { userId: req.user._id, exerciseId: req.params.moduleId }, // Use moduleId as exerciseId
        {
          $set: {
            completed: completed || false,
            progress: progress || 0,
            lastAccessed: Date.now(),
            ...(tasks ? { tasks: sanitizedTasks } : {}), // Only update tasks if provided
            ...completionData
          },
          $setOnInsert: {
            userId: req.user._id,
            exerciseId: req.params.moduleId, // Use moduleId as exerciseId
            startedAt: Date.now()
          }
        },
        { 
          upsert: true 
        }
      );
      
      // Get the updated document
      const updatedProgress = await Progress.findOne({ 
        userId: req.user._id, 
        exerciseId: req.params.moduleId  // Use moduleId as exerciseId
      });
      
      // Log the direct progress update (backward compatibility)
      console.log(`Direct progress update (backward compatibility) for user ${req.user._id} on module ${req.params.moduleId}:`, {
        requestedProgress: progress,
        requestedCompleted: completed,
        resultProgress: updatedProgress.progress,
        resultCompleted: updatedProgress.completed
      });
      
      res.json(updatedProgress);
    } catch (mongoError) {
      console.error('MongoDB error:', mongoError);
      
      // Last resort - try with a complete replacement of the document
      try {
        // First delete any existing document
        await Progress.deleteOne({ 
          userId: req.user._id, 
          exerciseId: req.params.moduleId  // Use moduleId as exerciseId
        });
        
        // Then create a fresh document without any problematic fields
        const newProgress = new Progress({
          userId: req.user._id,
          exerciseId: req.params.moduleId,  // Use moduleId as exerciseId
          tasks: sanitizedTasks,
          completed: completed || false,
          progress: progress || 0,
          startedAt: Date.now(),
          lastAccessed: Date.now(),
          ...completionData
        });
        
        await newProgress.save();
        res.json(newProgress);
      } catch (replaceError) {
        console.error('Complete replacement also failed:', replaceError);
        res.status(400).json({ 
          message: 'Error updating module progress', 
          error: replaceError.message 
        });
      }
    }
  } catch (error) {
    console.error('Error in module progress route:', error);
    res.status(400).json({ message: 'Error updating module progress', error: error.message });
  }
});

// Update task progress within an exercise
router.patch('/exercise/:exerciseId/task/:taskId', auth, async (req, res) => {
  try {
    const { exerciseId, taskId } = req.params;
    const { completed, completedSteps } = req.body;
    
    console.log(`Updating task progress for user ${req.user._id}, exercise ${exerciseId}, task ${taskId}`, {
      completed,
      completedSteps,
      requestBody: req.body
    });
    
    // Validate the data
    if (typeof completed !== 'boolean' && completedSteps === undefined) {
      console.error('Invalid request - missing required fields:', req.body);
      return res.status(400).json({ 
        message: 'At least one of completed or completedSteps must be provided',
        received: req.body
      });
    }
    
    // Ensure completedSteps is an array if provided
    if (completedSteps !== undefined && !Array.isArray(completedSteps)) {
      console.error('Invalid completedSteps format:', completedSteps);
      return res.status(400).json({ 
        message: 'completedSteps must be an array',
        received: completedSteps
      });
    }
    
    // Use the findOrCreate static method to prevent duplicate key errors
    let progress;
    try {
      progress = await Progress.findOrCreate(req.user._id, exerciseId);
    } catch (findError) {
      console.error('Error finding or creating progress record:', findError);
      return res.status(500).json({
        message: 'Database error while finding or creating progress record',
        error: findError.message
      });
    }
    
    // Find or create task progress record
    let taskProgress = progress.tasks.find(task => task.taskId === taskId);
    
    if (!taskProgress) {
      console.log(`Adding new task ${taskId} to progress for exercise ${exerciseId}`);
      taskProgress = {
        taskId,
        completed: false,
        completedSteps: []
      };
      progress.tasks.push(taskProgress);
    }
    
    const taskIndex = progress.tasks.findIndex(task => task.taskId === taskId);
    
    // Prepare updates to the task
    const taskUpdates = {
      ...taskProgress
    };
    
    // Update completed status if provided
    if (typeof completed === 'boolean') {
      taskUpdates.completed = completed;
      // Set completion timestamp if newly completed
      if (completed && !taskProgress.completedAt) {
        taskUpdates.completedAt = Date.now();
      }
    }
    
    // Update completedSteps if provided
    if (Array.isArray(completedSteps)) {
      // Ensure all values are valid numbers
      const validSteps = completedSteps.filter(step => typeof step === 'number');
      if (validSteps.length !== completedSteps.length) {
        console.warn('Some invalid steps were removed:', 
          completedSteps.filter(step => typeof step !== 'number'));
      }
      
      // Ensure we don't have duplicate step indexes
      const existingSteps = taskProgress.completedSteps || [];
      taskUpdates.completedSteps = Array.from(new Set([...existingSteps, ...validSteps]));
      
      // Check if this task should be marked completed based on steps
      if (taskUpdates.completedSteps.length > 0 && !taskUpdates.completed) {
        // This is just an estimate since we don't know the total steps from here
        // A more sophisticated implementation would check against the actual exercise data
        const estimatedProgress = Math.min(100, Math.round((taskUpdates.completedSteps.length / 10) * 100));
        if (estimatedProgress >= 90) {
          taskUpdates.completed = true;
          taskUpdates.completedAt = Date.now();
        }
      }
    }
    
    // Apply the updates
    progress.tasks[taskIndex] = taskUpdates;
    
    // Update the access timestamp
    progress.lastAccessed = Date.now();
    
    // Calculate overall progress based on task completion
    const totalTasks = progress.tasks.length;
    const completedTasks = progress.tasks.filter(task => task.completed).length;
    progress.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // If all tasks are completed, mark the exercise as completed
    if (completedTasks === totalTasks && totalTasks > 0) {
      progress.completed = true;
      if (!progress.completedAt) {
        progress.completedAt = Date.now();
      }
    } else {
      progress.completed = false;
      progress.completedAt = undefined;
    }
    
    try {
      // Log the document before saving to debug structure
      console.log('Progress document before save:', JSON.stringify({
        id: progress._id,
        userId: progress.userId,
        exerciseId: progress.exerciseId,
        moduleId: progress.moduleId,
        tasks: progress.tasks.map(t => ({
          taskId: t.taskId,
          completed: t.completed,
          completedSteps: t.completedSteps
        }))
      }, null, 2));
      
      await progress.save();
      console.log(`Successfully updated progress for exercise ${exerciseId}`, {
        tasksCount: progress.tasks.length,
        completedTasks,
        overallProgress: progress.progress
      });
      
      res.json(progress);
    } catch (saveError) {
      console.error('Error saving progress:', saveError);
      console.error('Error details:', saveError.errors || saveError.message);
      console.error('Stack trace:', saveError.stack);
      
      // Check for specific error types
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error while saving progress',
          validationErrors: saveError.errors
        });
      } else if (saveError.name === 'MongoServerError' && saveError.code === 11000) {
        console.log('Duplicate key error - data already exists, need to update instead of insert');
        
        // For duplicate key errors, handle differently - retry with findOneAndUpdate
        try {
          // Use findOneAndUpdate as a fallback for duplicate key errors
          const updatedProgress = await Progress.findOneAndUpdate(
            { userId: req.user._id, exerciseId: exerciseId },
            { 
              $set: { 
                lastAccessed: Date.now(),
                progress: progress.progress,
                completed: progress.completed,
                completedAt: progress.completedAt
              },
              $push: { 
                tasks: taskUpdates 
              }
            },
            { new: true, upsert: true }
          );
          
          return res.json(updatedProgress);
        } catch (updateError) {
          console.error('Error handling duplicate key conflict:', updateError);
          return res.status(500).json({
            message: 'Could not resolve duplicate key conflict',
            error: updateError.message
          });
        }
      } else {
        return res.status(500).json({
          message: 'Failed to save progress',
          error: saveError.message
        });
      }
    }
  } catch (error) {
    console.error('Error updating task progress:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      message: 'Failed to update task progress',
      error: error.message,
      details: error.stack
    });
  }
});

// BACKWARD COMPATIBILITY: Update exercise progress within a module (now task progress within an exercise)
router.post('/module/:moduleId/exercise/:exerciseId', auth, async (req, res) => {
  try {
    const { completed, completedSteps } = req.body;
    const moduleId = req.params.moduleId; // This is now treated as exerciseId
    const exerciseId = req.params.exerciseId; // This is now treated as taskId
    
    // Find the exercise to get step information
    let exercise = null;
    try {
      exercise = await Exercise.findOne({ id: moduleId });
    } catch (exerciseError) {
      console.log(`Could not find exercise with id: ${moduleId}`, exerciseError.message);
      // Continue even if exercise is not found - we'll handle this case
    }
    
    // Store exercise in request for use in progress calculation
    req.exercise = exercise;
    
    // Find the exercise progress or create if it doesn't exist
    let exerciseProgress = await Progress.findOne({
      userId: req.user._id,
      exerciseId: moduleId // Use moduleId as exerciseId
    });
    
    if (!exerciseProgress) {
      exerciseProgress = new Progress({
        userId: req.user._id,
        exerciseId: moduleId, // Use moduleId as exerciseId
        tasks: []
      });
    }
    
    // Add new task progress entry if it doesn't exist yet
    if (!exerciseProgress.tasks.some(task => task.taskId === exerciseId)) {
      exerciseProgress.tasks.push({
        taskId: exerciseId, // Use exerciseId as taskId
        completed: false,
        completedSteps: [],
        startedAt: Date.now()
      });
    }
    
    // Find the task in the progress
    const taskIndex = exerciseProgress.tasks.findIndex(task => task.taskId === exerciseId);
    
    if (taskIndex >= 0) {
      // Update existing task
      exerciseProgress.tasks[taskIndex].completed = completed || exerciseProgress.tasks[taskIndex].completed;
      
      if (completedSteps) {
        exerciseProgress.tasks[taskIndex].completedSteps = completedSteps;
      }
      
      if (completed && !exerciseProgress.tasks[taskIndex].completedAt) {
        exerciseProgress.tasks[taskIndex].completedAt = Date.now();
      }
    }
    
    // Calculate overall progress percentage
    if (exerciseProgress.tasks.length > 0) {
      const totalTasks = exerciseProgress.tasks.length;
      let completedTasksCount = 0;
      
      // Calculate partial task completion for step-by-step tasks
      exerciseProgress.tasks.forEach(task => {
        if (task.completed) {
          // Task is fully completed
          completedTasksCount += 1;
        } else if (task.completedSteps && task.completedSteps.length > 0) {
          // Task is partially completed, get exercise from database to determine total steps
          if (exercise && exercise.tasks) {
            const exerciseTask = exercise.tasks.find(t => t.id === task.taskId);
            if (exerciseTask && exerciseTask.steps && exerciseTask.steps.length > 0) {
              // Calculate partial completion (e.g., 2 of 4 steps = 0.5 tasks)
              completedTasksCount += (task.completedSteps.length / exerciseTask.steps.length);
            } else {
              // If we can't find the task details, assume partial credit (0.5)
              completedTasksCount += 0.5;
            }
          } else {
            // If exercise is null, assume partial credit (0.5)
            completedTasksCount += 0.5;
          }
        }
      });
      
      // Calculate progress percentage
      exerciseProgress.progress = Math.round((completedTasksCount / totalTasks) * 100);
      
      // If all tasks are fully completed, mark the exercise as completed
      const fullyCompletedTasks = exerciseProgress.tasks.filter(task => task.completed).length;
      if (fullyCompletedTasks === totalTasks) {
        exerciseProgress.completed = true;
        exerciseProgress.completedAt = Date.now();
        exerciseProgress.progress = 100; // Ensure progress is exactly 100% when all tasks are complete
      } else {
        // Not all tasks are completed
        exerciseProgress.completed = false;
        exerciseProgress.completedAt = null;
      }
    }
    
    exerciseProgress.lastAccessed = Date.now();
    await exerciseProgress.save();
    
    // Log the progress for debugging
    console.log(`Progress update (backward compatibility) for user ${req.user._id} on exercise ${moduleId}:`, {
      progress: exerciseProgress.progress,
      completed: exerciseProgress.completed,
      tasksCount: exerciseProgress.tasks.length,
      completedTasksCount: exerciseProgress.tasks.filter(task => task.completed).length
    });
    
    res.json(exerciseProgress);
  } catch (error) {
    res.status(400).json({ message: 'Error updating exercise progress', error: error.message });
  }
});

// Get leaderboard data
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { moduleType } = req.query;

    // Get all data in parallel (similar to class monitoring)
    const [allUsers, progressRecords, quizResults, publishedTutorials, totalQuizzes, totalExercises] = await Promise.all([
      User.find({}).select('_id username email role').lean(),
      Progress.find().populate('exerciseId', 'title').lean(),
      Quiz.QuizResult.find().populate(['userId', 'quizId']).lean(),
      Tutorial.find({ published: true }).select('_id title').lean(),
      Quiz.Quiz.countDocuments(),
      Exercise.countDocuments()
    ]);

    console.log(`Leaderboard - Found ${publishedTutorials.length} published tutorials`);
    console.log(`Leaderboard - Found ${allUsers.length} users`);
    console.log(`Leaderboard - Found ${totalQuizzes} total quizzes`);
    console.log(`Leaderboard - Found ${totalExercises} total exercises`);

    // Process each user's data
    const leaderboardData = await Promise.all(allUsers.map(async (user) => {
      // Get user's exercise progress
      const userProgress = progressRecords.filter(
        progress => progress.userId.toString() === user._id.toString()
      );

      // Get user's quiz results  
      const userQuizResults = quizResults.filter(
        result => {
          const resultUserId = result.userId?._id || result.userId;
          return resultUserId?.toString() === user._id.toString();
        }
      );

      // Count unique quizzes completed by this user
      const uniqueQuizIds = new Set(
        userQuizResults
          .filter(result => result.quizId)
          .map(result => {
            return result.quizId._id ? result.quizId._id.toString() : result.quizId.toString();
          })
      );
      const completedQuizzes = uniqueQuizIds.size;

      // Get user's tutorial progress
      const tutorialProgress = await TutorialProgress.find({ 
        userId: user._id 
      }).lean();

      // Count completed tutorials and exercises
      const completedTutorials = tutorialProgress.filter(tp => tp.status === 'completed').length;
      const completedExercises = userProgress.filter(p => p.completed === true).length;

      // Calculate points
      const exercisePoints = completedExercises * 10; // 10 points per exercise
      const tutorialPoints = completedTutorials * 15; // 15 points per tutorial
      const quizPoints = userQuizResults.reduce((sum, result) => sum + (result.score || 0), 0);
      const totalPoints = exercisePoints + tutorialPoints + quizPoints;

      // Calculate quiz average
      const quizAverage = userQuizResults.length > 0 ? 
        Math.round(userQuizResults.reduce((sum, result) => sum + result.score, 0) / userQuizResults.length) : 0;

      console.log(`Leaderboard User ${user.username}:`, {
        exercises: `${completedExercises}/${totalExercises}`,
        tutorials: `${completedTutorials}/${publishedTutorials.length}`, 
        quizzes: `${completedQuizzes}/${totalQuizzes}`,
        totalPoints
      });

      return {
        _id: user._id,
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        totalActivities: totalExercises + publishedTutorials.length + totalQuizzes,
        completedActivities: completedExercises + completedTutorials + completedQuizzes,
        totalProgress: Math.round(((completedExercises + completedTutorials + completedQuizzes) / (totalExercises + publishedTutorials.length + totalQuizzes)) * 100) || 0,
        totalPoints: Math.round(totalPoints),
        learningModules: completedTutorials, // Tutorials are learning modules
        exercises: completedExercises,
        quizzes: completedQuizzes,
        modulePoints: { tutorials: tutorialPoints },
        exercisePoints: exercisePoints,
        quizPoints: quizPoints,
        quizAverage: quizAverage,
        badges: [] // Badge system can be implemented later
      };
    }));

    // Sort based on moduleType
    let sortedData = [...leaderboardData];
    if (moduleType) {
      switch(moduleType) {
        case 'modules':
          sortedData.sort((a, b) => b.learningModules - a.learningModules);
          break;
        case 'exercises':
          sortedData.sort((a, b) => b.exercises - a.exercises);
          break;
        case 'quizzes':
          sortedData.sort((a, b) => b.quizzes - a.quizzes);
          break;
        default:
          sortedData.sort((a, b) => b.totalPoints - a.totalPoints);
      }
    } else {
      // Default sort by total points
      sortedData.sort((a, b) => b.totalPoints - a.totalPoints);
    }

    // Add rank and current user flag
    const rankedData = sortedData.map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user._id.toString() === req.user._id.toString()
    }));

    res.json(rankedData);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      message: 'Error fetching leaderboard data', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 