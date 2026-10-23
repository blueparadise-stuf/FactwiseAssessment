import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance: any = null;
let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const isProduction = ENV.NODE_ENV === 'production';
  let uri = ENV.MONGODB_URI;

  // Never start an in-memory database in production.
  if (isProduction && !uri) {
    throw new Error(
      'MONGODB_URI is required in production. Configure it in Vercel Environment Variables.'
    );
  }

  // In-memory MongoDB is allowed only for development/testing.
  if (!isProduction && (!uri || ENV.USE_MEMORY_DB)) {
    console.log('Starting development in-memory MongoDB...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    uri = mongodInstance.getUri();
  }

  cachedPromise = mongoose
    .connect(uri!, {
      serverSelectionTimeoutMS: 15000,
      bufferCommands: false,
    })
    .then((m) => {
      console.log(`MongoDB connected successfully: ${mongoose.connection.host}`);
      return m;
    })
    .catch(async (error) => {
      cachedPromise = null;
      console.error('MongoDB connection failed:', error);

      if (mongodInstance) {
        await mongodInstance.stop();
        mongodInstance = null;
      }

      throw error;
    });

  return cachedPromise;
};

export const disconnectDB = async (): Promise<void> => {
  cachedPromise = null;
  await mongoose.disconnect();

  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};
