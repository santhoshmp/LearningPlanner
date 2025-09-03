import { connectDatabase, connectRedis, checkDatabaseHealth, checkRedisHealth, gracefulShutdown } from './database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  console.log('🚀 Initializing database connections...');
  
  try {
    // Connect to PostgreSQL
    console.log('📊 Connecting to PostgreSQL...');
    await connectDatabase();
    console.log('✅ PostgreSQL connected successfully');

    // Test database health
    const dbHealthy = await checkDatabaseHealth();
    if (!dbHealthy) {
      throw new Error('Database health check failed');
    }
    console.log('✅ Database health check passed');

    // Connect to Redis
    console.log('🔴 Connecting to Redis...');
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // Test Redis health
    const redisHealthy = await checkRedisHealth();
    if (!redisHealthy) {
      throw new Error('Redis health check failed');
    }
    console.log('✅ Redis health check passed');

    console.log('🎉 All database connections initialized successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };