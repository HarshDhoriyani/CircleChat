const getTimestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

export const logger = {
  info: (...args) => {
    console.log(`\x1b[36m[${getTimestamp()}]\x1b[0m \x1b[32m[INFO]\x1b[0m`, ...args);
  },
  warn: (...args) => {
    console.warn(`\x1b[36m[${getTimestamp()}]\x1b[0m \x1b[33m[WARN]\x1b[0m`, ...args);
  },
  error: (...args) => {
    console.error(`\x1b[36m[${getTimestamp()}]\x1b[0m \x1b[31m[ERROR]\x1b[0m`, ...args);
  },
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[36m[${getTimestamp()}]\x1b[0m \x1b[35m[DEBUG]\x1b[0m`, ...args);
    }
  },
};

export default logger;
