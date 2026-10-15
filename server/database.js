const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');

let memoryServer = null;

async function connectDatabase() {
  let uri = config.mongoUri;

  if (!uri) {
    if (!config.isDev) {
      throw new Error('MONGODB_URI is required outside development');
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('wvs');
    logger.warn('MONGODB_URI not set - using in-memory MongoDB (data is lost on restart)');
  }

  const hasDbName = /^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(uri);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    ...(hasDbName ? {} : { dbName: 'wvs' })
  });
  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

function databaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

module.exports = { connectDatabase, disconnectDatabase, databaseStatus };
