import dotenv from 'dotenv';

dotenv.config();

/**
 * Server configuration
 */
export const serverConfig = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
