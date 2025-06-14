const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Tutorial = require('../src/models/Tutorial');

/**
 * Test utilities for setting up MongoDB memory server and test users
 */
async function setupTestDB() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    return mongoServer;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

async function teardownTestDB(mongoServer) {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error tearing down test database:', error);
  }
}

async function createTestUsers() {
  try {
    // Create test users with different roles
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    const lecturerUser = await User.create({
      username: 'lecturer',
      email: 'lecturer@example.com',
      password: 'password123',
      role: 'lecturer'
    });

    const regularUser = await User.create({
      username: 'student',
      email: 'student@example.com',
      password: 'password123',
      role: 'student'
    });

    return { adminUser, lecturerUser, regularUser };
  } catch (error) {
    console.error('Error creating test users:', error);
    throw error;
  }
}

async function getAuthTokens() {
  try {
    // Get auth tokens
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    const adminToken = adminResponse.body.token;

    const lecturerResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lecturer@example.com', password: 'password123' });
    const lecturerToken = lecturerResponse.body.token;

    const userResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@example.com', password: 'password123' });
    const authToken = userResponse.body.token;

    return { adminToken, lecturerToken, authToken };
  } catch (error) {
    console.error('Error getting auth tokens:', error);
    throw error;
  }
}

async function clearTutorials() {
  try {
    await Tutorial.deleteMany({});
  } catch (error) {
    console.error('Error clearing tutorials:', error);
    throw error;
  }
}

module.exports = {
  setupTestDB,
  teardownTestDB,
  createTestUsers,
  getAuthTokens,
  clearTutorials,
  app,
  request,
  mongoose
}; 