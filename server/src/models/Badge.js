const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['exercise', 'tutorial', 'quiz', 'completion', 'milestone'],
    required: true
  },
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  criteria: {
    // Dynamic criteria based on type
    exerciseCount: Number,
    tutorialCount: Number,
    quizCount: Number,
    averageScore: Number,
    completionPercentage: Number
  },
  points: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const userBadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0 // Progress towards earning the badge (0-100)
  }
}, {
  timestamps: true
});

// Ensure one badge per user
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);
const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

module.exports = { Badge, UserBadge }; 