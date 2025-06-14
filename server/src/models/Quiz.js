const mongoose = require('mongoose');

// Schema for a quiz option
const quizOptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
}, { _id: false });

// Schema for a quiz question
const quizQuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  options: {
    type: [quizOptionSchema],
    required: true
  },
  type: {
    type: String,
    enum: ['single', 'multiple'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
}, { _id: false });

// Main schema for a quiz
const quizSchema = new mongoose.Schema({
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
  questions: {
    type: [quizQuestionSchema],
    required: true
  },
  timeLimit: {
    type: Number,
    required: true
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

// Schema for quiz submissions
const quizSubmissionSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    selectedOptions: {
      type: [String],
      required: true
    }
  }],
  score: {
    type: Number
  },
  completed: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date
  }
});

// Schema for quiz results
const quizResultSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  earnedPoints: {
    type: Number,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a text index for searching
quizSchema.index({ 
  title: 'text',
  description: 'text'
});

const Quiz = mongoose.model('Quiz', quizSchema);
const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);
const QuizResult = mongoose.model('QuizResult', quizResultSchema);

module.exports = { Quiz, QuizSubmission, QuizResult };