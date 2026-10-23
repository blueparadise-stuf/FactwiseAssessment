import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'caretrack_dev_jwt_secret_change_in_production_32bytes_min',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'caretrack_cookie_secret_change_in_production',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI
};
