// Minimal logger for production: only warn and error. Can be upgraded later.
module.exports = {
  warn: (...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

