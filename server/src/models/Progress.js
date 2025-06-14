const mongoose = require('mongoose');

// Schema for an individual task progress
const taskProgressSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedSteps: {
    type: [Number],
    default: [],
    validate: {
      validator: function(v) {
        // Validate that this is an array of numbers
        return Array.isArray(v) && v.every(step => typeof step === 'number');
      },
      message: props => `${props.value} is not a valid array of step numbers!`
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// Schema for exercise progress
const exerciseProgressSchema = new mongoose.Schema({
  exerciseId: {
    type: String,
    required: true
  },
  // For backwards compatibility - will be removed in future versions
  moduleId: {
    type: String,
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tasks: {
    type: [taskProgressSchema],
    default: []
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Remove the strict compound index to avoid the duplicate key error
// Instead, we'll handle duplicates manually in our code
// This line is commented out to prevent duplicate key errors:
// exerciseProgressSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

// Add validation for tasks array
exerciseProgressSchema.path('tasks').validate(function(tasks) {
  if (!Array.isArray(tasks)) return false;
  
  // Check for duplicate taskIds
  const taskIds = tasks.map(task => task.taskId);
  const uniqueTaskIds = new Set(taskIds);
  return taskIds.length === uniqueTaskIds.size;
}, 'Tasks array contains duplicate taskIds!');

// Add a pre-save hook to ensure completedSteps are always arrays
// and handle moduleId consistency
exerciseProgressSchema.pre('save', function(next) {
  if (this.tasks) {
    this.tasks.forEach(task => {
      if (task.completedSteps === undefined || task.completedSteps === null) {
        task.completedSteps = [];
      } else if (!Array.isArray(task.completedSteps)) {
        // Try to convert to array if possible
        try {
          task.completedSteps = Array.from(task.completedSteps);
        } catch (err) {
          task.completedSteps = [];
        }
      }
    });
  }
  
  // Handle moduleId for backwards compatibility
  // If moduleId is null or undefined, set it to match exerciseId
  if (this.moduleId === null || this.moduleId === undefined) {
    this.moduleId = this.exerciseId || undefined;
  }
  
  next();
});

// Add static method to find or create progress record
exerciseProgressSchema.statics.findOrCreate = async function(userId, exerciseId) {
  try {
    // Try to find an existing record
    let progress = await this.findOne({ userId, exerciseId });
    
    // If found, return it
    if (progress) {
      return progress;
    }
    
    // If not found, create a new one
    progress = new this({
      userId,
      exerciseId,
      moduleId: exerciseId, // Set moduleId same as exerciseId for compatibility
      completed: false,
      progress: 0,
      tasks: [],
      lastAccessed: Date.now(),
      startedAt: Date.now()
    });
    
    await progress.save();
    return progress;
  } catch (error) {
    // If we get a duplicate key error, try finding again (race condition)
    if (error.code === 11000) {
      return await this.findOne({ userId, exerciseId });
    }
    throw error;
  }
};

const Progress = mongoose.model('Progress', exerciseProgressSchema);

module.exports = Progress; 