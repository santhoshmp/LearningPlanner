const { PrismaClient } = require('@prisma/client');
const { redisService } = require('./dist/services/redisService');
const { childProgressService } = require('./dist/services/childProgressService');

async function testCachingPerformance() {
  console.log('🚀 Testing caching performance optimizations...\n');

  try {
    // Connect to Redis
    await redisService.connect();
    console.log('✅ Connected to Redis');

    // Test child ID
    const testChildId = 'test-child-123';

    // Test 1: Cache miss (first request)
    console.log('\n📊 Test 1: Cache miss performance');
    const start1 = Date.now();
    
    try {
      const summary1 = await childProgressService.generateProgressSummary(testChildId);
      const time1 = Date.now() - start1;
      console.log(`   First request (cache miss): ${time1}ms`);
      console.log(`   Summary generated with ${summary1.totalActivities} activities`);
    } catch (error) {
      console.log(`   First request failed (expected): ${error.message}`);
    }

    // Test 2: Cache hit (second request)
    console.log('\n📊 Test 2: Cache hit performance');
    const start2 = Date.now();
    
    try {
      const summary2 = await childProgressService.generateProgressSummary(testChildId);
      const time2 = Date.now() - start2;
      console.log(`   Second request (cache hit): ${time2}ms`);
      console.log(`   Summary retrieved from cache`);
    } catch (error) {
      console.log(`   Second request failed: ${error.message}`);
    }

    // Test 3: Redis basic operations
    console.log('\n📊 Test 3: Redis operations');
    
    const testKey = 'test:performance';
    const testData = { message: 'Hello Redis!', timestamp: new Date() };
    
    const setStart = Date.now();
    await redisService.setCacheObject(testKey, testData, 60);
    const setTime = Date.now() - setStart;
    console.log(`   Redis SET operation: ${setTime}ms`);
    
    const getStart = Date.now();
    const retrieved = await redisService.getCacheObject(testKey);
    const getTime = Date.now() - getStart;
    console.log(`   Redis GET operation: ${getTime}ms`);
    console.log(`   Retrieved data: ${JSON.stringify(retrieved)}`);

    // Test 4: Cache invalidation
    console.log('\n📊 Test 4: Cache invalidation');
    
    const invalidateStart = Date.now();
    await redisService.del(testKey);
    const invalidateTime = Date.now() - invalidateStart;
    console.log(`   Cache invalidation: ${invalidateTime}ms`);
    
    const checkStart = Date.now();
    const afterInvalidation = await redisService.getCacheObject(testKey);
    const checkTime = Date.now() - checkStart;
    console.log(`   Check after invalidation: ${checkTime}ms`);
    console.log(`   Data after invalidation: ${afterInvalidation}`);

    // Test 5: Bulk operations
    console.log('\n📊 Test 5: Bulk operations');
    
    const bulkData = {};
    for (let i = 0; i < 10; i++) {
      bulkData[`bulk:key:${i}`] = `value-${i}`;
    }
    
    const bulkSetStart = Date.now();
    await redisService.mset(bulkData);
    const bulkSetTime = Date.now() - bulkSetStart;
    console.log(`   Bulk SET (10 keys): ${bulkSetTime}ms`);
    
    const bulkGetStart = Date.now();
    const bulkKeys = Object.keys(bulkData);
    const bulkValues = await redisService.mget(bulkKeys);
    const bulkGetTime = Date.now() - bulkGetStart;
    console.log(`   Bulk GET (10 keys): ${bulkGetTime}ms`);
    console.log(`   Retrieved ${bulkValues.filter(v => v !== null).length} values`);

    // Test 6: Cache statistics
    console.log('\n📊 Test 6: Cache statistics');
    
    const stats = await redisService.getCacheStats();
    console.log(`   Total keys in cache: ${stats.totalKeys}`);
    console.log(`   Memory usage: ${stats.memoryUsage}`);

    // Cleanup
    await redisService.deletePattern('bulk:key:*');
    console.log('\n🧹 Cleaned up test data');

    console.log('\n✅ All caching performance tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await redisService.disconnect();
    console.log('🔌 Disconnected from Redis');
  }
}

// Run the test
testCachingPerformance().catch(console.error);