import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { seedDatabase } from './scripts/seed.js';
import { User } from './models/User.js';

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if running fresh or empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Automatically running initial seed data...');
      await seedDatabase();
    }

    const port = ENV.PORT;

    app.listen(port, () => {
      console.log(`=================================================`);
      console.log(`ArogyaDesk API Server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/api/health`);
      console.log(`API Base: http://localhost:${port}/api/v1`);
      console.log(`Environment: ${ENV.NODE_ENV}`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
