const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  const validUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'student'
  };

  test('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.username).toBe(validUser.username);
    expect(response.body.user.email).toBe(validUser.email);
    expect(response.body.user.role).toBe('student');
  });

  test('should not allow duplicate email registration', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send(validUser);

    // Attempt duplicate registration
    const response = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already exists');
  });

  test('should validate password length', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        ...validUser,
        password: '12345' // Less than 6 characters
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Password must be at least 6 characters');
  });

  test('should require all mandatory fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        // Missing email and password
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('All fields are required');
  });

  // This test suite validates the user registration functionality:
  // - Ensures new users can register successfully
  // - Prevents duplicate email registrations
  // - Enforces password length requirements
  // - Validates that all required fields are provided
}); 