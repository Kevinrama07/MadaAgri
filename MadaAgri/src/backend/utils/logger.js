const winston = require('winston');
const path = require('path');

// Format personnalisé
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'madaagri-backend' },
  transports: [
    // Fichier pour tous les logs d'erreur
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Fichier pour tous les logs combinés
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Ajouter console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, error, stack, ...meta }) => {
          let output = `${timestamp} [${level}]: ${message}`;
          
          // Afficher la stack si disponible
          if (stack) {
            output += `\n${stack}`;
          }
          
          // Ajouter les métadonnées (avec serialisation appropriée)
          if (Object.keys(meta).length > 0 && JSON.stringify(meta) !== '{"service":"madaagri-backend"}') {
            output += `\n${JSON.stringify(meta, (key, value) => {
              if (value instanceof Error) {
                return { name: value.name, message: value.message, stack: value.stack };
              }
              return value;
            }, 2)}`;
          }
          
          return output;
        })
      ),
    })
  );
}

module.exports = logger;
