/**
 * Logger configuration using pino
 * Uses DEBUG_AGENTS environment variable to enable detailed logging
 * Uses pino-pretty for readable output in development
 */
import pino from 'pino';
import pinoPretty from 'pino-pretty';

const debugAgents = process.env.DEBUG_AGENTS === 'true';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino(
  {
    level: debugAgents ? 'debug' : 'info',
  },
  isDevelopment
    ? pinoPretty({
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      })
    : undefined
);

export default logger;
