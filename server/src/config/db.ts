
import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance: any = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const isProduction = ENV.NODE_ENV === 'production';
  let uri = ENV.MONGODB_URI;

  // Never start an in-memory database in production.
  if (isProduction && !uri) {
    throw new Error(
      'MONGODB_URI is required in production. Configure it in Vercel.'
    );
  }

  // In-memory MongoDB is allowed only for development/testing.
  if (!isProduction && (!uri || ENV.USE_MEMORY_DB)) {
    console.log('Starting development in-memory MongoDB...');

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    uri = mongodInstance.getUri();
  }

  try {
    await mongoose.connect(uri!, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `MongoDB connected successfully: ${mongoose.connection.host}`
    );
  } catch (error) {
    console.error('MongoDB connection failed:', error);

    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }

    throw error;
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();

  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};
