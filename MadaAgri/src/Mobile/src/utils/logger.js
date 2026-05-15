const DEBUG = true; // Changez à false en production

const logger = {
  log: (...args) => {
    if (DEBUG) {
      console.log('[LOG]', ...args);
    }
  },

  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  info: (...args) => {
    if (DEBUG) {
      console.info('[INFO]', ...args);
    }
  },

  debug: (...args) => {
    if (DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },

  group: (label) => {
    if (DEBUG && console.group) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (DEBUG && console.groupEnd) {
      console.groupEnd();
    }
  },

  time: (label) => {
    if (DEBUG) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (DEBUG) {
      console.timeEnd(label);
    }
  },
};

export default logger;
