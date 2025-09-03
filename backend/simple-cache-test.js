// Simple test to verify Redis caching functionality
const redis = require('redis');

async function testRedisPerformance() {
  console.log('🚀 Testing Redis caching performance...\n');

  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis');

    // Test 1: Basic SET/GET operations
    console.log('\n📊 Test 1: Basic operations');
    
    const setStart = Date.now();
    await client.set('test:performance', JSON.stringify({ message: 'Hello Redis!', timestamp: new Date() }));
    const setTime = Date.now() - setStart;
    console.log(`   SET operation: ${setTime}ms`);
    
    const getStart = Date.now();
    const value = await client.get('test:performance');
    const getTime = Date.now() - getStart;
    console.log(`   GET operation: ${getTime}ms`);
    console.log(`   Retrieved: ${JSON.parse(value).message}`);

    // Test 2: Cache with expiration
    console.log('\n📊 Test 2: Cache with TTL');
    
    const expireStart = Date.now();
    await client.setEx('test:expire', 5, 'This will expire in 5 seconds');
    const expireTime = Date.now() - expireStart;
    console.log(`   SET with expiration: ${expireTime}ms`);
    
    const ttl = await client.ttl('test:expire');
    console.log(`   TTL remaining: ${ttl} seconds`);

    // Test 3: Bulk operations
    console.log('\n📊 Test 3: Bulk operations');
    
    const bulkData = {};
    for (let i = 0; i < 10; i++) {
      bulkData[`bulk:key:${i}`] = `value-${i}`;
    }
    
    const bulkSetStart = Date.now();
    await client.mSet(bulkData);
    const bulkSetTime = Date.now() - bulkSetStart;
    console.log(`   Bulk SET (10 keys): ${bulkSetTime}ms`);
    
    const bulkGetStart = Date.now();
    const bulkKeys = Object.keys(bulkData);
    const bulkValues = await client.mGet(bulkKeys);
    const bulkGetTime = Date.now() - bulkGetStart;
    console.log(`   Bulk GET (10 keys): ${bulkGetTime}ms`);
    console.log(`   Retrieved ${bulkValues.filter(v => v !== null).length} values`);

    // Test 4: Pattern operations
    console.log('\n📊 Test 4: Pattern operations');
    
    const patternStart = Date.now();
    const keys = await client.keys('bulk:key:*');
    const patternTime = Date.now() - patternStart;
    console.log(`   Pattern search: ${patternTime}ms`);
    console.log(`   Found ${keys.length} keys matching pattern`);

    // Test 5: Cache simulation for child progress
    console.log('\n📊 Test 5: Child progress cache simulation');
    
    const childId = 'test-child-123';
    const progressData = {
      totalActivities: 20,
      completedActivities: 14,
      averageScore: 85,
      currentStreak: 5,
      lastUpdate: new Date()
    };
    
    const cacheStart = Date.now();
    await client.setEx(`progress_summary:${childId}`, 900, JSON.stringify(progressData)); // 15 minutes
    const cacheTime = Date.now() - cacheStart;
    console.log(`   Cache child progress: ${cacheTime}ms`);
    
    const retrieveStart = Date.now();
    const cachedProgress = await client.get(`progress_summary:${childId}`);
    const retrieveTime = Date.now() - retrieveStart;
    console.log(`   Retrieve cached progress: ${retrieveTime}ms`);
    
    const parsed = JSON.parse(cachedProgress);
    console.log(`   Cached data: ${parsed.completedActivities}/${parsed.totalActivities} activities completed`);

    // Cleanup
    await client.del('test:performance');
    await client.del(`progress_summary:${childId}`);
    
    const deleteStart = Date.now();
    const deletedCount = await client.del(bulkKeys);
    const deleteTime = Date.now() - deleteStart;
    console.log(`\n🧹 Cleanup: Deleted ${deletedCount} keys in ${deleteTime}ms`);

    console.log('\n✅ All Redis performance tests completed successfully!');
    console.log('\n📈 Performance Summary:');
    console.log(`   - Single SET: ${setTime}ms`);
    console.log(`   - Single GET: ${getTime}ms`);
    console.log(`   - Bulk SET (10): ${bulkSetTime}ms`);
    console.log(`   - Bulk GET (10): ${bulkGetTime}ms`);
    console.log(`   - Pattern search: ${patternTime}ms`);
    console.log(`   - Child progress cache: ${cacheTime}ms`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.disconnect();
    console.log('🔌 Disconnected from Redis');
  }
}

// Run the test
testRedisPerformance().catch(console.error);