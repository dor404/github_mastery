/**
 * Test Suite: BSPM25T5-50 - Edit Modules
 * Tests the ability for lecturers to update existing modules
 */

const { 
  setupTestDB, 
  teardownTestDB, 
  createTestUsers, 
  getAuthTokens, 
  clearTutorials,
  app, 
  request,
  mongoose 
} = require('./testUtils');
const User = require('../src/models/User');
const Tutorial = require('../src/models/Tutorial');

let mongoServer;
let authToken;
let adminToken;
let lecturerToken;
let tutorialId;

beforeAll(async () => {
  mongoServer = await setupTestDB();
  await createTestUsers();
  const tokens = await getAuthTokens();
  adminToken = tokens.adminToken;
  lecturerToken = tokens.lecturerToken;
  authToken = tokens.authToken;
}, 30000);

afterAll(async () => {
  await teardownTestDB(mongoServer);
}, 30000);

describe('Edit Modules - BSPM25T5-50', () => {
  beforeEach(async () => {
    await clearTutorials();
    
    // Get lecturer user for creating a test module with a specific author
    const lecturerUser = await User.findOne({ username: 'lecturer' });
    
    // Create a test module with the lecturer as author
    const tutorial = new Tutorial({
      title: 'Original Title',
      content: 'Original content',
      description: 'Original description',
      difficulty: 'beginner',
      tags: ['original'],
      published: true,
      author: lecturerUser._id
    });
    
    await tutorial.save();
    tutorialId = tutorial._id;
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
    const initialVersion = beforeUpdate.version || 0;

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