const mongoose = require('mongoose');

// Schema for a branch node in the visualization
const branchNodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  attributes: {
    commit: String,
    message: String,
    timestamp: String
  },
  children: {
    type: [mongoose.Schema.Types.Mixed], // Allows nested branchNodeSchema
    default: []
  }
}, { _id: false });

// Schema for a task step
const taskStepSchema = new mongoose.Schema({
  instruction: {
    type: String,
    required: true
  },
  solution: {
    type: String,
    required: true
  },
  validationCommand: String
}, { _id: false });

// Schema for a task
const taskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  hints: {
    type: [String],
    default: []
  },
  solution: {
    type: String,
    required: true
  },
  validationCommand: String,
  isStepByStep: {
    type: Boolean,
    default: false
  },
  steps: {
    type: [taskStepSchema],
    default: []
  }
}, { _id: false });

// Main schema for a training exercise
const exerciseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tasks: {
    type: [taskSchema],
    default: []
  },
  prerequisites: {
    type: [String],
    default: []
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  estimatedTime: {
    type: String,
    required: true
  },
  visualization: {
    type: branchNodeSchema,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a text index for searching
exerciseSchema.index({ 
  title: 'text',
  description: 'text',
  content: 'text'
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise; 