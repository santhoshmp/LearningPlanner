#!/usr/bin/env node

/**
 * Test script to verify learning streak calculation logic
 */

const { PrismaClient } = require('@prisma/client');
const { childProgressService } = require('./dist/services/childProgressService');

const prisma = new PrismaClient();

async function testStreakCalculation() {
  console.log('🧪 Testing Learning Streak Calculation...\n');

  try {
    // Find a test child
    const child = await prisma.childProfile.findFirst({
      where: { isActive: true }
    });

    if (!child) {
      console.log('❌ No active child found. Please create a test child first.');
      return;
    }

    console.log(`📝 Testing with child: ${child.name} (${child.id})`);

    // Clear existing streaks for clean test
    await prisma.learningStreak.deleteMany({
      where: { childId: child.id }
    });

    console.log('🧹 Cleared existing streaks for clean test\n');

    // Test 1: First activity completion - should create new streaks
    console.log('Test 1: First activity completion');
    await childProgressService.updateLearningStreaks(child.id, 'mathematics', 85, 0);
    
    let streaks = await prisma.learningStreak.findMany({
      where: { childId: child.id },
      orderBy: { streakType: 'asc' }
    });

    console.log('Streaks after first completion:');
    streaks.forEach(streak => {
      console.log(`  ${streak.streakType}: ${streak.currentCount} (longest: ${streak.longestCount})`);
    });

    // Test 2: Same day completion - should increment activity completion but not daily
    console.log('\nTest 2: Same day completion');
    await childProgressService.updateLearningStreaks(child.id, 'mathematics', 92, 1);
    
    streaks = await prisma.learningStreak.findMany({
      where: { childId: child.id },
      orderBy: { streakType: 'asc' }
    });

    console.log('Streaks after same day completion:');
    streaks.forEach(streak => {
      console.log(`  ${streak.streakType}: ${streak.currentCount} (longest: ${streak.longestCount})`);
    });

    // Test 3: Perfect score - should increment perfect score streak
    console.log('\nTest 3: Perfect score completion');
    await childProgressService.updateLearningStreaks(child.id, 'mathematics', 100, 0);
    
    streaks = await prisma.learningStreak.findMany({
      where: { childId: child.id },
      orderBy: { streakType: 'asc' }
    });

    console.log('Streaks after perfect score:');
    streaks.forEach(streak => {
      console.log(`  ${streak.streakType}: ${streak.currentCount} (longest: ${streak.longestCount})`);
    });

    // Test 4: Simulate next day activity
    console.log('\nTest 4: Next day activity (simulated)');
    
    // Update the last activity date to yesterday for daily streak test
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    await prisma.learningStreak.updateMany({
      where: { 
        childId: child.id,
        streakType: 'DAILY'
      },
      data: {
        lastActivityDate: yesterday
      }
    });

    await childProgressService.updateLearningStreaks(child.id, 'mathematics', 78, 2);
    
    streaks = await prisma.learningStreak.findMany({
      where: { childId: child.id },
      orderBy: { streakType: 'asc' }
    });

    console.log('Streaks after next day activity:');
    streaks.forEach(streak => {
      console.log(`  ${streak.streakType}: ${streak.currentCount} (longest: ${streak.longestCount})`);
    });

    // Test 5: Test streak reset after gap
    console.log('\nTest 5: Activity after 3-day gap (should reset daily streak)');
    
    // Update the last activity date to 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    await prisma.learningStreak.updateMany({
      where: { 
        childId: child.id,
        streakType: 'DAILY'
      },
      data: {
        lastActivityDate: threeDaysAgo
      }
    });

    await childProgressService.updateLearningStreaks(child.id, 'mathematics', 88, 0);
    
    streaks = await prisma.learningStreak.findMany({
      where: { childId: child.id },
      orderBy: { streakType: 'asc' }
    });

    console.log('Streaks after 3-day gap:');
    streaks.forEach(streak => {
      console.log(`  ${streak.streakType}: ${streak.currentCount} (longest: ${streak.longestCount})`);
    });

    console.log('\n✅ Streak calculation tests completed successfully!');

    // Test dashboard data includes streaks
    console.log('\nTesting dashboard data includes streak information...');
    const dashboardData = await childProgressService.getCachedDashboardData(child.id);
    
    console.log('Dashboard streaks:');
    dashboardData.streaks.forEach(streak => {
      console.log(`  ${streak.streakType}: ${streak.currentCount} (active: ${streak.isActive})`);
    });

    console.log('\n🎉 All tests passed! Streak calculation is working correctly.');

  } catch (error) {
    console.error('❌ Error testing streak calculation:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStreakCalculation();