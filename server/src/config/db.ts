import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance: any = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  let uri = ENV.MONGODB_URI;

  if (!uri || ENV.USE_MEMORY_DB) {
    console.log('No MONGODB_URI provided or USE_MEMORY_DB enabled. Initializing embedded in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`Embedded MongoDB started at: ${uri}`);
    } catch (err) {
      console.error('Failed to start in-memory MongoDB:', err);
      throw err;
    }
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected successfully to ${mongoose.connection.host || 'embedded instance'}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // If external URI failed in development, try falling back to memory server
    if (ENV.NODE_ENV !== 'production' && !mongodInstance) {
      console.log('Attempting fallback to in-memory MongoDB for local dev...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log(`Connected to fallback embedded MongoDB: ${uri}`);
      return;
    }
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error event:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Reconnection will be attempted automatically.');
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
