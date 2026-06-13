import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebug = process.env.DEBUG === 'true' || process.env.DEBUG_AGENTS === 'true';

export const logger = pino({
  level: isDebug ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;
