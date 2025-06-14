/**
 * Test Suite: BSPM25T5-54 - Create Modules
 * Tests the ability for lecturers to create learning modules
 */

const { 
  setupTestDB, 
  teardownTestDB, 
  createTestUsers, 
  getAuthTokens, 
  clearTutorials,
  app, 
  request 
} = require('./testUtils');

let mongoServer;
let authToken;
let adminToken;
let lecturerToken;
let tutorialId;

// Increased timeout to 30 seconds for database setup
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

beforeEach(async () => {
  await clearTutorials();
});

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