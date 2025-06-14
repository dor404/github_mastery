// This file runs before all tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = 'localhost';
process.env.ap= 'OPENAI_API_KEY=openai-api-key';


// Set a global timeout for all tests
jest.setTimeout(60000);

// Silence console logs during tests
global.console = {
  log: jest.fn(), // console.log are ignored in tests
  error: jest.fn(), // console.error are ignored in tests
  warn: jest.fn(), // console.warn are ignored in tests
  info: jest.fn(), // console.info are ignored in tests
  debug: jest.fn(), // console.debug are ignored in tests
};

// Add any global test setup here
beforeAll(async () => {
  // Add any setup that needs to run before all tests
  // For example: database connection, test data setup, etc.
});

afterAll(async () => {
  // Add any cleanup that needs to run after all tests
  // For example: closing database connections, cleaning test data, etc.
}); 