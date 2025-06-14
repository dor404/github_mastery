const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const Tutorial = require('../src/models/Tutorial');
const User = require('../src/models/User');

let mongoServer;
let authToken;
let adminToken;
let lecturerToken;
let tutorialId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

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

  // Get auth tokens
  const adminResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'password123' });
  adminToken = adminResponse.body.token;

  const lecturerResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'lecturer@example.com', password: 'password123' });
  lecturerToken = lecturerResponse.body.token;

  const userResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@example.com', password: 'password123' });
  authToken = userResponse.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Tutorial.deleteMany({});
});

/**
 * Test Suite: BSPM25T5-54 - Create Modules
 * Tests the ability for lecturers to create learning modules
 */
describe('Create Modules - BSPM25T5-54', () => {
  const validModule = {
    title: 'Git Basics',
    content: 'Learn about Git fundamentals and basic commands',
    description: 'An introduction to Git',
    difficulty: 'beginner',
    tags: ['git', 'basics'],
    published: true
  };

  test('lecturer should be able to create a module', async () => {
    const response = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send(validModule);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe(validModule.title);
    
    // Store the ID for later tests
    tutorialId = response.body._id;
  });

  test('admin should be able to create a module', async () => {
    const response = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validModule);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(validModule.title);
  });

  test('student should not be able to create a module', async () => {
    const response = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validModule);

    expect(response.status).toBe(403);
  });

  test('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send({
        // Missing required fields
        title: 'Test Module'
      });

    expect(response.status).toBe(400);
  });
});

/**
 * Test Suite: BSPM25T5-27 - Filter/Search Modules
 * Tests the ability to filter modules by difficulty or topic
 */
describe('Filter/Search Modules - BSPM25T5-27', () => {
  beforeEach(async () => {
    // Create test modules with different difficulties and tags
    await Tutorial.create({
      title: 'Beginner Module',
      content: 'Content for beginners',
      description: 'For beginners',
      difficulty: 'beginner',
      tags: ['basics', 'introduction'],
      published: true,
      author: new mongoose.Types.ObjectId()
    });

    await Tutorial.create({
      title: 'Advanced Module',
      content: 'Advanced content',
      description: 'For advanced users',
      difficulty: 'advanced',
      tags: ['advanced', 'expert'],
      published: true,
      author: new mongoose.Types.ObjectId()
    });

    // Unpublished module - shouldn't appear in searches
    await Tutorial.create({
      title: 'Draft Module',
      content: 'Draft content',
      description: 'Not published',
      difficulty: 'intermediate',
      tags: ['draft'],
      published: false,
      author: new mongoose.Types.ObjectId()
    });
  });

  test('should get all published modules', async () => {
    const response = await request(app)
      .get('/api/tutorials/published')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2); // Only published modules
  });

  test('should filter modules by difficulty', async () => {
    const response = await request(app)
      .get('/api/tutorials/search?difficulty=beginner')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Beginner Module');
  });

  test('should filter modules by tags', async () => {
    const response = await request(app)
      .get('/api/tutorials/search?tags=expert')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Advanced Module');
  });

  test('should filter by text search', async () => {
    const response = await request(app)
      .get('/api/tutorials/search?query=advanced')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Advanced Module');
  });
});

/**
 * Test Suite: BSPM25T5-57 - Delete Modules
 * Tests the ability for admins and lecturers to delete modules
 */
describe('Delete Modules - BSPM25T5-57', () => {
  beforeEach(async () => {
    // Create a test module
    const module = await Tutorial.create({
      title: 'Module to Delete',
      content: 'Content to delete',
      description: 'Will be deleted',
      difficulty: 'beginner',
      tags: ['delete'],
      published: true,
      author: new mongoose.Types.ObjectId()
    });
    
    tutorialId = module._id;
  });

  test('lecturer should be able to delete any module', async () => {
    const response = await request(app)
      .delete(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${lecturerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tutorial deleted successfully');
    
    // Verify it's gone
    const moduleInDB = await Tutorial.findById(tutorialId);
    expect(moduleInDB).toBeNull();
  });

  test('admin should be able to delete any module', async () => {
    const response = await request(app)
      .delete(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tutorial deleted successfully');
  });

  test('student should not be able to delete modules', async () => {
    const response = await request(app)
      .delete(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(403);
  });

  test('should return 404 for non-existent module', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/api/tutorials/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

/**
 * Test Suite: BSPM25T5-50 - Edit Modules
 * Tests the ability for lecturers to update existing modules
 */
describe('Edit Modules - BSPM25T5-50', () => {
  beforeEach(async () => {
    // Create a test module with a specific author
    const lecturerUser = await User.findOne({ role: 'lecturer' });
    
    const module = await Tutorial.create({
      title: 'Original Title',
      content: 'Original content',
      description: 'Original description',
      difficulty: 'beginner',
      tags: ['original'],
      published: true,
      author: lecturerUser._id
    });
    
    tutorialId = module._id;
  });

  test('author should be able to edit their module', async () => {
    const updatedData = {
      title: 'Updated Title',
      description: 'Updated description'
    };

    const response = await request(app)
      .patch(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.description).toBe(updatedData.description);
  });

  test('admin should be able to edit any module', async () => {
    const updatedData = {
      title: 'Admin Updated Title',
      difficulty: 'advanced'
    };

    const response = await request(app)
      .patch(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.difficulty).toBe(updatedData.difficulty);
  });

  test('version should increment when content is updated', async () => {
    // Get current version
    const beforeUpdate = await Tutorial.findById(tutorialId);
    const initialVersion = beforeUpdate.version;

    // Update content
    const updatedData = {
      content: 'New content that should increment version'
    };

    const response = await request(app)
      .patch(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.version).toBe(initialVersion + 1);
  });

  test('student should not be able to edit modules', async () => {
    const response = await request(app)
      .patch(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Student Update' });

    expect(response.status).toBe(403);
  });
}); 