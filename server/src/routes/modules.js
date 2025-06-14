const express = require('express');
const Exercise = require('../models/Exercise');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all modules (public)
router.get('/', async (req, res) => {
  try {
    const modules = await Exercise.find()
      .populate('createdBy', 'username')
      .select('-content') // Don't include full content in list view
      .sort('-createdAt');
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching modules', error: error.message });
  }
});

// Get a single module by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const module = await Exercise.findOne({ id: req.params.id })
      .populate('createdBy', 'username');
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.json(module);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching module', error: error.message });
  }
});

// Create a new module (lecturer/admin only)
router.post('/', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    // Generate a URL-safe ID from the title if not provided
    if (!req.body.id) {
      req.body.id = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    const module = new Exercise({
      ...req.body,
      createdBy: req.user._id
    });
    
    await module.save();
    res.status(201).json(module);
  } catch (error) {
    res.status(400).json({ message: 'Error creating module', error: error.message });
  }
});

// Update a module (lecturer/admin only)
router.patch('/:id', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    // Find by module ID (not MongoDB _id)
    const module = await Exercise.findOne({ id: req.params.id });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Update the updatedAt timestamp
    req.body.updatedAt = Date.now();
    
    // Update the module
    Object.assign(module, req.body);
    await module.save();
    
    res.json(module);
  } catch (error) {
    res.status(400).json({ message: 'Error updating module', error: error.message });
  }
});

// Delete a module (admin only)
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const result = await Exercise.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting module', error: error.message });
  }
});

// Add an exercise to a module (lecturer/admin only)
router.post('/:id/exercises', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const module = await Exercise.findOne({ id: req.params.id });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Generate a unique ID for the exercise
    const exerciseId = `ex-${Date.now().toString(36)}`;
    
    const newExercise = {
      id: exerciseId,
      ...req.body
    };
    
    module.exercises.push(newExercise);
    module.updatedAt = Date.now();
    
    await module.save();
    
    res.status(201).json(newExercise);
  } catch (error) {
    res.status(400).json({ message: 'Error adding exercise', error: error.message });
  }
});

// Update an exercise (lecturer/admin only)
router.patch('/:moduleId/exercises/:exerciseId', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const module = await Exercise.findOne({ id: req.params.moduleId });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const exerciseIndex = module.exercises.findIndex(ex => ex.id === req.params.exerciseId);
    
    if (exerciseIndex === -1) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    // Update the exercise fields
    module.exercises[exerciseIndex] = {
      ...module.exercises[exerciseIndex].toObject(),
      ...req.body,
      id: req.params.exerciseId // Ensure ID doesn't change
    };
    
    module.updatedAt = Date.now();
    await module.save();
    
    res.json(module.exercises[exerciseIndex]);
  } catch (error) {
    res.status(400).json({ message: 'Error updating exercise', error: error.message });
  }
});

// Delete an exercise (lecturer/admin only)
router.delete('/:moduleId/exercises/:exerciseId', auth, checkRole('lecturer', 'admin'), async (req, res) => {
  try {
    const module = await Exercise.findOne({ id: req.params.moduleId });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const exerciseIndex = module.exercises.findIndex(ex => ex.id === req.params.exerciseId);
    
    if (exerciseIndex === -1) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    // Remove the exercise
    module.exercises.splice(exerciseIndex, 1);
    module.updatedAt = Date.now();
    
    await module.save();
    
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exercise', error: error.message });
  }
});

module.exports = router; 