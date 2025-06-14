const mongoose = require('mongoose');

const tutorialProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutorialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutorial',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  currentPage: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one progress record per user per tutorial
tutorialProgressSchema.index({ userId: 1, tutorialId: 1 }, { unique: true });

// Static method to find or create progress record
tutorialProgressSchema.statics.findOrCreate = async function(userId, tutorialId) {
  try {
    let progress = await this.findOne({ userId, tutorialId });
    
    if (!progress) {
      progress = new this({
        userId,
        tutorialId,
        status: 'not_started',
        currentPage: 0,
        lastAccessed: Date.now()
      });
      await progress.save();
    }
    
    return progress;
  } catch (error) {
    if (error.code === 11000) {
      return await this.findOne({ userId, tutorialId });
    }
    throw error;
  }
};

const TutorialProgress = mongoose.model('TutorialProgress', tutorialProgressSchema);

module.exports = TutorialProgress; 