const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/server');
const Exercise = require('../src/models/Exercise');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
const { setupTestDB, teardownTestDB, clearDatabase } = require('./mongodb-test-helper');

// Mock data for tests
const testAdmin = {
  _id: new mongoose.Types.ObjectId(),
  username: 'testadmin',
  email: 'testadmin@example.com',
  password: 'password123',
  role: 'admin'
};

const testUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'password123',
  role: 'student'
};

const testLecturer = {
  _id: new mongoose.Types.ObjectId(),
  username: 'testlecturer',
  email: 'testlecturer@example.com',
  password: 'password123',
  role: 'lecturer'
};

const testExercise = {
  id: 'test-exercise',
  title: 'Test Exercise',
  description: 'This is a test exercise',
  content: 'Exercise content goes here',
  tasks: [
    {
      id: 'task-1',
      question: 'Test Question',
      description: 'Test task description',
      hints: ['Hint 1', 'Hint 2'],
      solution: 'test solution',
      validationCommand: 'test command'
    }
  ],
  difficulty: 'beginner',
  estimatedTime: '30 minutes',
  createdBy: testAdmin._id
};

// Generate tokens
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );
};

// Connect to test database before all tests
beforeAll(async () => {
  // Setup MongoDB Memory Server
  await setupTestDB();
  
  // Create test users
  await User.create(testAdmin);
  await User.create(testUser);
  await User.create(testLecturer);
}, 60000); // Increase timeout to 60 seconds

// Clean up database after all tests
afterAll(async () => {
  await teardownTestDB();
}, 60000); // Increase timeout to 60 seconds

// Clear exercises between tests
afterEach(async () => {
  await Exercise.deleteMany({});
}, 30000); // Increase timeout to 30 seconds

describe('Exercise API', () => {
  describe('GET /api/exercises', () => {
    test('returns empty array when no exercises exist', async () => {
      const response = await request(app).get('/api/exercises');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
    
    test('returns all exercises when they exist', async () => {
      await Exercise.create(testExercise);
      
      const response = await request(app).get('/api/exercises');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testExercise.id);
    });
  });
  
  describe('GET /api/exercises/:id', () => {
    test('returns 404 for non-existent exercise', async () => {
      const response = await request(app).get('/api/exercises/nonexistentid');
      
      expect(response.status).toBe(404);
    });
    
    test('returns the exercise when it exists', async () => {
      await Exercise.create(testExercise);
      
      const response = await request(app).get(`/api/exercises/${testExercise.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testExercise.id);
      expect(response.body.title).toBe(testExercise.title);
    });
  });
  
  describe('POST /api/exercises', () => {
    test('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({
          title: 'New Exercise',
          description: 'Description',
          content: 'Content',
          difficulty: 'beginner',
          estimatedTime: '20 minutes'
        });
      
      expect(response.status).toBe(401);
    });
    
    test('returns 403 when authenticated as regular user', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Exercise',
          description: 'Description',
          content: 'Content',
          difficulty: 'beginner',
          estimatedTime: '20 minutes'
        });
      
      expect(response.status).toBe(403);
    });
    
    test('creates exercise when authenticated as lecturer', async () => {
      const token = generateToken(testLecturer);
      
      const newExercise = {
        title: 'New Exercise',
        description: 'Description for new exercise',
        content: 'Content for new exercise',
        difficulty: 'beginner',
        estimatedTime: '20 minutes',
        tasks: []
      };
      
      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(newExercise);
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newExercise.title);
      expect(response.body.description).toBe(newExercise.description);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdBy.toString()).toBe(testLecturer._id.toString());
      
      // Verify in database
      const savedExercise = await Exercise.findOne({ id: response.body.id });
      expect(savedExercise).not.toBeNull();
      expect(savedExercise.title).toBe(newExercise.title);
    });
    
    test('creates exercise when authenticated as admin', async () => {
      const token = generateToken(testAdmin);
      
      const newExercise = {
        title: 'Admin Exercise',
        description: 'Description from admin',
        content: 'Content from admin',
        difficulty: 'advanced',
        estimatedTime: '60 minutes',
        tasks: []
      };
      
      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(newExercise);
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newExercise.title);
      expect(response.body.difficulty).toBe(newExercise.difficulty);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdBy.toString()).toBe(testAdmin._id.toString());
    });
    
    test('generates ID from title if not provided', async () => {
      const token = generateToken(testLecturer);
      
      const newExercise = {
        title: 'Exercise With Generated ID',
        description: 'Description',
        content: 'Content',
        difficulty: 'beginner',
        estimatedTime: '20 minutes'
      };
      
      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send(newExercise);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBe('exercise-with-generated-id');
    });
  });
  
  describe('PATCH /api/exercises/:id', () => {
    beforeEach(async () => {
      await Exercise.create(testExercise);
    });
    
    test('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}`)
        .send({ title: 'Updated Title' });
      
      expect(response.status).toBe(401);
    });
    
    test('returns 403 when authenticated as regular user', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });
      
      expect(response.status).toBe(403);
    });
    
    test('updates exercise when authenticated as lecturer', async () => {
      const token = generateToken(testLecturer);
      
      const updates = {
        title: 'Updated by Lecturer',
        description: 'Updated description'
      };
      
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updates.title);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.content).toBe(testExercise.content); // Unchanged
      
      // Verify in database
      const updatedExercise = await Exercise.findOne({ id: testExercise.id });
      expect(updatedExercise.title).toBe(updates.title);
      expect(updatedExercise.updatedAt).toBeDefined();
    });
    
    test('updates exercise when authenticated as admin', async () => {
      const token = generateToken(testAdmin);
      
      const updates = {
        title: 'Updated by Admin',
        difficulty: 'advanced'
      };
      
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updates.title);
      expect(response.body.difficulty).toBe(updates.difficulty);
    });
    
    test('returns 404 for non-existent exercise', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .patch('/api/exercises/nonexistentid')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/exercises/:id', () => {
    beforeEach(async () => {
      await Exercise.create(testExercise);
    });
    
    test('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}`);
      
      expect(response.status).toBe(401);
    });
    
    test('returns 403 when authenticated as regular user', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403);
    });
    
    test('returns 403 when authenticated as lecturer', async () => {
      const token = generateToken(testLecturer);
      
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403);
    });
    
    test('deletes exercise when authenticated as admin', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Exercise deleted successfully');
      
      // Verify deletion in database
      const deletedExercise = await Exercise.findOne({ id: testExercise.id });
      expect(deletedExercise).toBeNull();
    });
    
    test('returns 404 for non-existent exercise', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .delete('/api/exercises/nonexistentid')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });
  });
}); 