const config = require('./config');
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./database');
const logger = require('./utils/logger');

async function start() {
  try {
    await connectDatabase();
  } catch (err) {
    logger.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(`WVS API listening on http://localhost:${config.port}/api (${config.env})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
