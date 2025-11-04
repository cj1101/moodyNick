const logger = require('../utils/logger');

function errorHandler(err, req, res, next) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    logger.error('[ERROR]', err.stack || err);
  } else {
    logger.warn('[WARN]', err.message);
  }

  res.status(status).json({
    message: err.publicMessage || err.message || 'Server error',
    ...(isProd ? {} : { stack: err.stack })
  });
}

module.exports = errorHandler;

