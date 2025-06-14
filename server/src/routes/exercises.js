const express = require('express');
const Exercise = require('../models/Exercise');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all exercises (public)
router.get('/', async (req, res) => {
  try {
    const exercises = await Exercise.find()
      .populate('createdBy', 'username')
      .select('-content') // Don't include full content in list view
      .sort('-createdAt');
    res.json(exercises);
  } catch (error) {
    res.status(500).send();
  }
});

// Get a single exercise by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ id: req.params.id })
      .populate('createdBy', 'username');
    
    if (!exercise) {
      return res.status(404).send();
    }
    
    res.json(exercise);
  } catch (error) {
    res.status(500).send();
  }
});

// Create a new exercise (lecturer/admin only)
router.post('/', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    // Generate a URL-safe ID from the title if not provided
    if (!req.body.id) {
      req.body.id = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    const exercise = new Exercise({
      ...req.body,
      createdBy: req.user._id
    });
    
    await exercise.save();
    res.status(201).json(exercise);
  } catch (error) {
    res.status(400).send();
  }
});

// Update an exercise (lecturer/admin only)
router.patch('/:id', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    // Find by exercise ID (not MongoDB _id)
    const exercise = await Exercise.findOne({ id: req.params.id });
    
    if (!exercise) {
      return res.status(404).send();
    }
    
    // Update the updatedAt timestamp
    req.body.updatedAt = Date.now();
    
    // Update the exercise
    Object.assign(exercise, req.body);
    await exercise.save();
    
    res.json(exercise);
  } catch (error) {
    res.status(400).send();
  }
});

// Delete an exercise (admin only)
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const result = await Exercise.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).send();
    }
    
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    res.status(500).send();
  }
});

// Add a task to an exercise (lecturer/admin only)
router.post('/:id/tasks', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ id: req.params.id });
    
    if (!exercise) {
      return res.status(404).send();
    }
    
    // Generate a unique ID for the task
    const taskId = `task-${Date.now().toString(36)}`;
    
    const newTask = {
      id: taskId,
      ...req.body
    };
    
    exercise.tasks.push(newTask);
    exercise.updatedAt = Date.now();
    
    await exercise.save();
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).send();
  }
});

// Update a task (lecturer/admin only)
router.patch('/:exerciseId/tasks/:taskId', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ id: req.params.exerciseId });
    
    if (!exercise) {
      return res.status(404).send();
    }
    
    const taskIndex = exercise.tasks.findIndex(ex => ex.id === req.params.taskId);
    
    if (taskIndex === -1) {
      return res.status(404).send();
    }
    
    // Update the task fields
    exercise.tasks[taskIndex] = {
      ...exercise.tasks[taskIndex].toObject(),
      ...req.body,
      id: req.params.taskId // Ensure ID doesn't change
    };
    
    exercise.updatedAt = Date.now();
    await exercise.save();
    
    res.json(exercise.tasks[taskIndex]);
  } catch (error) {
    res.status(400).send();
  }
});

// Delete a task (lecturer/admin only)
router.delete('/:exerciseId/tasks/:taskId', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ id: req.params.exerciseId });
    
    if (!exercise) {
      return res.status(404).send();
    }
    
    const taskIndex = exercise.tasks.findIndex(ex => ex.id === req.params.taskId);
    
    if (taskIndex === -1) {
      return res.status(404).send();
    }
    
    // Remove the task
    exercise.tasks.splice(taskIndex, 1);
    exercise.updatedAt = Date.now();
    
    await exercise.save();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router; 