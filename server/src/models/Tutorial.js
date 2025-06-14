const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  points: {
    type: Number,
    default: 10
  }
});

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  }
});

const tutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  tags: [{
    type: String
  }],
  exercises: [exerciseSchema],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutorial'
  }],
  pages: [pageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create text index for search functionality
tutorialSchema.index({ 
  title: 'text',
  content: 'text',
  description: 'text',
  tags: 'text'
});

const Tutorial = mongoose.model('Tutorial', tutorialSchema);

module.exports = Tutorial; 