const mongoose = require('mongoose');
const logger = require('../utils/logger');

let memServer = null;

const connectDB = async () => {
  // Accept both MONGO_URI and MONGODB_URI (common naming variants)
  let uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const isAtlas = uri && uri.startsWith('mongodb+srv://');

  // Try to connect to the configured URI
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: isAtlas ? 10000 : 3000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    // In production, always exit — no fallback
    if (isAtlas || process.env.NODE_ENV === 'production') {
      logger.error(`Failed to connect to MongoDB: ${error.message}`);
      logger.error('Check MONGO_URI, Atlas network access whitelist, and credentials.');
      process.exit(1);
    }
    logger.warn(`Could not connect to ${uri} — falling back to in-memory MongoDB.`);
  }

  // Fallback: start an in-memory MongoDB server (local/dev only)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memServer = await MongoMemoryServer.create();
    uri = memServer.getUri();
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    logger.info(`In-Memory MongoDB started: ${conn.connection.host} (data resets on restart)`);
  } catch (err) {
    logger.error(`MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;
