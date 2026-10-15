const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const apiRoutes = require('./routes/api');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '10kb' }));
if (config.env !== 'test') app.use(morgan(config.isDev ? 'dev' : 'combined'));

app.use('/api', apiLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
