const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// MongoDB connection options - with improved settings to avoid timeouts
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  socketTimeoutMS: 60000,  // Increase socket timeout 
  connectTimeoutMS: 60000, // Increase connection timeout
  serverSelectionTimeoutMS: 60000, // Increase server selection timeout
  heartbeatFrequencyMS: 5000, // More frequent heartbeats
  // Disable buffering to get better error messages
  bufferCommands: false
};

// Variables to store MongoDB instances
let mongoServer;

// Setup function to create MongoDB instance and connect
const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, mongooseOptions);
  
  // Clear all MongoDB buffered operations
  mongoose.connection.bufferMaxEntries = 0;
  
  return mongoServer;
};

// Teardown function to close connection and stop MongoDB instance
const teardownTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Function to clear all collections
const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  mongooseOptions
}; 