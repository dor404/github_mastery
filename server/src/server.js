const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const tutorialRoutes = require('./routes/tutorials');
const progressRoutes = require('./routes/progress');
const exerciseRoutes = require('./routes/exercises');
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quizzes');
const chatRoutes = require('./routes/chat.routes');
const dashboardRoutes = require('./routes/dashboard');
const badgeRoutes = require('./routes/badges');
const BadgeService = require('./services/badgeService');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'http://localhost:3000'  // Production origin
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'], // Development origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));  // Increase payload limit for base64 images
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.warn('⚠️  Running in development mode without MongoDB. Some features may not work properly.');
    console.warn('💡 To use full functionality, please install and start MongoDB.');
    // Don't exit the process - continue running without DB for development
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/badges', badgeRoutes);

// Keep /api/modules for backward compatibility
app.use('/api/modules', exerciseRoutes);

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running successfully!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to database and start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    console.log('Database connected successfully');
    
    // Auto-initialize badges if they don't exist
    try {
      const Badge = require('./models/Badge').Badge;
      const badgeCount = await Badge.countDocuments();
      
      if (badgeCount < 18) {
        console.log('Initializing badge system...');
        await BadgeService.initializeDefaultBadges();
        const finalCount = await Badge.countDocuments();
        console.log(`✅ Badge system ready with ${finalCount} badges`);
      } else {
        console.log(`✅ Badge system ready with ${badgeCount} badges`);
      }
    } catch (error) {
      console.error('⚠️ Badge initialization failed:', error.message);
    }
  });
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; 