/**
 * Logger simple pour le frontend
 * Utilise console avec timestamps
 */

const isDevelopment = import.meta.env.MODE === 'development';

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

export const logger = {
  info: (message, data) => {
    const timestamp = getTimestamp();
    console.log(`[${timestamp}] INFO:`, message, data || '');
  },

  warn: (message, data) => {
    const timestamp = getTimestamp();
    console.warn(`[${timestamp}] WARN:`, message, data || '');
  },

  error: (message, error) => {
    const timestamp = getTimestamp();
    console.error(`[${timestamp}] ERROR:`, message, error || '');
    if (isDevelopment && error?.stack) {
      console.error(error.stack);
    }
  },

  debug: (message, data) => {
    if (isDevelopment) {
      const timestamp = getTimestamp();
      console.debug(`[${timestamp}] DEBUG:`, message, data || '');
    }
  },
};

export default logger;
