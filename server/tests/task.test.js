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
  await User.create(testLecturer);
}, 60000); // Increase timeout to 60 seconds

// Clean up database after all tests
afterAll(async () => {
  await teardownTestDB();
}, 60000); // Increase timeout to 60 seconds

// Reset exercises between tests
beforeEach(async () => {
  await Exercise.deleteMany({});
  await Exercise.create(testExercise);
}, 30000);

describe('Exercise Task Management API', () => {
  describe('POST /api/exercises/:id/tasks', () => {
    test('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/exercises/${testExercise.id}/tasks`)
        .send({
          question: 'New Task',
          description: 'New task description',
          hints: ['New hint'],
          solution: 'new solution',
          validationCommand: 'new command'
        });
      
      expect(response.status).toBe(401);
    });
    
    test('returns 404 for non-existent exercise', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .post('/api/exercises/nonexistentid/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          question: 'New Task',
          description: 'New task description',
          hints: ['New hint'],
          solution: 'new solution',
          validationCommand: 'new command'
        });
      
      expect(response.status).toBe(404);
    });
    
    test('adds task to exercise when authenticated as lecturer', async () => {
      const token = generateToken(testLecturer);
      
      const newTask = {
        question: 'New Task Question',
        description: 'New task description',
        hints: ['New hint 1', 'New hint 2'],
        solution: 'new solution command',
        validationCommand: 'test validation'
      };
      
      const response = await request(app)
        .post(`/api/exercises/${testExercise.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send(newTask);
      
      expect(response.status).toBe(201);
      expect(response.body.question).toBe(newTask.question);
      expect(response.body.id).toBeDefined();
      
      // Verify in database
      const updatedExercise = await Exercise.findOne({ id: testExercise.id });
      expect(updatedExercise.tasks.length).toBe(2);
      expect(updatedExercise.tasks[1].question).toBe(newTask.question);
    });
    
    test('adds task to exercise when authenticated as admin', async () => {
      const token = generateToken(testAdmin);
      
      const newTask = {
        question: 'Admin Task',
        description: 'Task added by admin',
        hints: ['Admin hint'],
        solution: 'admin solution',
        validationCommand: 'admin validation'
      };
      
      const response = await request(app)
        .post(`/api/exercises/${testExercise.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send(newTask);
      
      expect(response.status).toBe(201);
      expect(response.body.question).toBe(newTask.question);
      
      // Verify in database
      const updatedExercise = await Exercise.findOne({ id: testExercise.id });
      expect(updatedExercise.tasks.length).toBe(2);
      expect(updatedExercise.tasks[1].question).toBe(newTask.question);
    });
  });
  
  describe('PATCH /api/exercises/:exerciseId/tasks/:taskId', () => {
    test('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}/tasks/task-1`)
        .send({ question: 'Updated Question' });
      
      expect(response.status).toBe(401);
    });
    
    test('returns 404 for non-existent exercise', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .patch('/api/exercises/nonexistentid/tasks/task-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'Updated Question' });
      
      expect(response.status).toBe(404);
    });
    
    test('returns 404 for non-existent task', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}/tasks/nonexistenttask`)
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'Updated Question' });
      
      expect(response.status).toBe(404);
    });
    
    test('updates task when authenticated as lecturer', async () => {
      const token = generateToken(testLecturer);
      
      const updates = {
        question: 'Updated by Lecturer',
        description: 'Updated task description'
      };
      
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}/tasks/task-1`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.question).toBe(updates.question);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.id).toBe('task-1'); // ID should not change
      
      // Verify in database
      const updatedExercise = await Exercise.findOne({ id: testExercise.id });
      expect(updatedExercise.tasks[0].question).toBe(updates.question);
      expect(updatedExercise.tasks[0].description).toBe(updates.description);
    });
    
    test('keeps existing hints when only updating question', async () => {
      const token = generateToken(testAdmin);
      
      const updates = {
        question: 'New Question Title'
      };
      
      const response = await request(app)
        .patch(`/api/exercises/${testExercise.id}/tasks/task-1`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.question).toBe(updates.question);
      expect(response.body.hints).toEqual(testExercise.tasks[0].hints); // Hints should be preserved
    });
  });
  
  describe('DELETE /api/exercises/:exerciseId/tasks/:taskId', () => {
    test('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}/tasks/task-1`);
      
      expect(response.status).toBe(401);
    });
    
    test('returns 404 for non-existent exercise', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .delete('/api/exercises/nonexistentid/tasks/task-1')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });
    
    test('returns 404 for non-existent task', async () => {
      const token = generateToken(testAdmin);
      
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}/tasks/nonexistenttask`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
    });
    
    test('deletes task when authenticated as lecturer', async () => {
      const token = generateToken(testLecturer);
      
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}/tasks/task-1`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Task deleted successfully');
      
      // Verify deletion in database
      const updatedExercise = await Exercise.findOne({ id: testExercise.id });
      expect(updatedExercise.tasks.length).toBe(0);
    });
    
    test('deletes task when authenticated as admin', async () => {
      // First add a second task so we can verify the correct one is removed
      const token = generateToken(testAdmin);
      
      // Add a second task
      await request(app)
        .post(`/api/exercises/${testExercise.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          question: 'Second Task',
          description: 'Second task description',
          solution: 'second solution',
          validationCommand: 'second validation'
        });
      
      // Verify we now have 2 tasks
      let exercise = await Exercise.findOne({ id: testExercise.id });
      expect(exercise.tasks.length).toBe(2);
      
      // Now delete the original task
      const response = await request(app)
        .delete(`/api/exercises/${testExercise.id}/tasks/task-1`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      
      // Verify the right task was deleted
      exercise = await Exercise.findOne({ id: testExercise.id });
      expect(exercise.tasks.length).toBe(1);
      expect(exercise.tasks[0].question).toBe('Second Task');
    });
  });
}); 