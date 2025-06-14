const mongoose = require('mongoose');
const User = require('../models/User');
const Tutorial = require('../models/Tutorial');

// Connect to database with a hardcoded connection string for testing
const MONGODB_URI = 'mongodb://localhost:27017/learning-platform';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

const seedTutorials = async () => {
  try {
    // First check if there's a lecturer account
    let lecturer = await User.findOne({ role: 'lecturer' });
    
    if (!lecturer) {
      // Create a lecturer account if none exists
      lecturer = new User({
        username: 'lecturer',
        email: 'lecturer@example.com',
        password: 'hashedPassword123', // Not a real hash, just for testing
        role: 'lecturer'
      });
      await lecturer.save();
      console.log('Created lecturer account');
    }
    
    // Check if we already have tutorials
    const existingCount = await Tutorial.countDocuments();
    if (existingCount > 0) {
      console.log(`${existingCount} tutorials already exist, skipping tutorial seed`);
      return;
    }
    
    // Create some tutorials with various tags
    const tutorials = [
      {
        title: 'Introduction to JavaScript',
        content: '<h1>Introduction to JavaScript</h1><p>This is a beginner-friendly introduction to JavaScript...</p>',
        description: 'Learn the basics of JavaScript programming language',
        author: lecturer._id,
        difficulty: 'beginner',
        tags: ['JavaScript', 'Web Development', 'Programming'],
        published: true
      },
      {
        title: 'Advanced Python Techniques',
        content: '<h1>Advanced Python</h1><p>This tutorial covers advanced Python concepts...</p>',
        description: 'Master advanced Python programming techniques',
        author: lecturer._id,
        difficulty: 'advanced',
        tags: ['Python', 'Programming', 'Data Science'],
        published: true
      },
      {
        title: 'Introduction to React',
        content: '<h1>React Basics</h1><p>Learn how to build applications with React...</p>',
        description: 'Get started with React.js framework',
        author: lecturer._id,
        difficulty: 'intermediate',
        tags: ['JavaScript', 'React', 'Web Development', 'Frontend'],
        published: true
      },
      {
        title: 'Node.js Fundamentals',
        content: '<h1>Node.js Fundamentals</h1><p>Learn the core concepts of Node.js...</p>',
        description: 'Understanding the Node.js runtime',
        author: lecturer._id,
        difficulty: 'intermediate',
        tags: ['JavaScript', 'Node.js', 'Backend', 'Web Development'],
        published: true
      },
      {
        title: 'Docker Containers',
        content: '<h1>Docker</h1><p>Introduction to containerization with Docker...</p>',
        description: 'Learn how to use Docker for deployment',
        author: lecturer._id,
        difficulty: 'intermediate',
        tags: ['DevOps', 'Docker', 'Containers', 'Deployment'],
        published: true
      },
      {
        title: 'Machine Learning Basics',
        content: '<h1>ML Fundamentals</h1><p>Introduction to machine learning concepts...</p>',
        description: 'Learn the basics of machine learning algorithms',
        author: lecturer._id,
        difficulty: 'advanced',
        tags: ['Machine Learning', 'Data Science', 'Python', 'AI'],
        published: true
      },
      {
        title: 'Git Version Control',
        content: '<h1>Git Version Control</h1><p>Master Git for source control...</p>',
        description: 'Learn Git version control from basics to advanced',
        author: lecturer._id,
        difficulty: 'beginner',
        tags: ['Git', 'Version Control', 'DevOps'],
        published: true
      },
      {
        title: 'SQL Database Design',
        content: '<h1>SQL Database Design</h1><p>Learn how to design efficient databases...</p>',
        description: 'Master SQL database design principles',
        author: lecturer._id,
        difficulty: 'intermediate',
        tags: ['SQL', 'Database', 'Data Design'],
        published: true
      }
    ];
    
    await Tutorial.insertMany(tutorials);
    console.log(`Added ${tutorials.length} sample tutorials with tags`);
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding tutorials:', error);
    process.exit(1);
  }
};

// Run the seed function
seedTutorials(); 