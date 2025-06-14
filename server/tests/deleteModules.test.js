/**
 * Test Suite: BSPM25T5-57 - Delete Modules
 * Tests the ability for admins and lecturers to delete modules
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

describe('Delete Modules - BSPM25T5-57', () => {
  beforeEach(async () => {
    await clearTutorials();
    
    // Create a test module to delete
    const response = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send({
        title: 'Module to Delete',
        content: 'Content to delete',
        description: 'Will be deleted',
        difficulty: 'beginner',
        tags: ['delete'],
        published: true
      });
    
    tutorialId = response.body._id;
  });

  test('lecturer should be able to delete any module', async () => {
    const response = await request(app)
      .delete(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${lecturerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tutorial deleted successfully');
    
    // Verify it's gone
    const checkResponse = await request(app)
      .get(`/api/tutorials/${tutorialId}`)
      .set('Authorization', `Bearer ${lecturerToken}`);
    
    expect(checkResponse.status).toBe(404);
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