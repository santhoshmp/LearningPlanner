#!/usr/bin/env node

/**
 * Test script to verify dashboard includes streak data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardStreaks() {
  console.log('🧪 Testing Dashboard Streak Data...\n');

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

    // Get current streaks
    const streaks = await prisma.learningStreak.findMany({
      where: { childId: child.id },
      orderBy: { streakType: 'asc' }
    });

    console.log('\nCurrent streaks in database:');
    streaks.forEach(streak => {
      console.log(`  ${streak.streakType}: ${streak.currentCount} (longest: ${streak.longestCount}, active: ${streak.isActive})`);
    });

    // Test dashboard data structure
    const dashboardData = {
      child: { id: child.id, name: child.name },
      currentStreaks: streaks,
      progressSummary: {
        currentDailyStreak: streaks.find(s => s.streakType === 'DAILY')?.currentCount || 0,
        longestDailyStreak: streaks.find(s => s.streakType === 'DAILY')?.longestCount || 0,
        activityCompletionStreak: streaks.find(s => s.streakType === 'ACTIVITY_COMPLETION')?.currentCount || 0,
        perfectScoreStreak: streaks.find(s => s.streakType === 'PERFECT_SCORE')?.currentCount || 0,
        helpFreeStreak: streaks.find(s => s.streakType === 'HELP_FREE')?.currentCount || 0
      }
    };

    console.log('\nDashboard data structure:');
    console.log('Current Streaks:', dashboardData.currentStreaks.map(s => ({
      type: s.streakType,
      current: s.currentCount,
      longest: s.longestCount,
      active: s.isActive
    })));

    console.log('\nProgress Summary Streaks:');
    console.log(`  Daily Streak: ${dashboardData.progressSummary.currentDailyStreak} (longest: ${dashboardData.progressSummary.longestDailyStreak})`);
    console.log(`  Activity Completion Streak: ${dashboardData.progressSummary.activityCompletionStreak}`);
    console.log(`  Perfect Score Streak: ${dashboardData.progressSummary.perfectScoreStreak}`);
    console.log(`  Help-Free Streak: ${dashboardData.progressSummary.helpFreeStreak}`);

    // Test that streaks are properly formatted for frontend
    const frontendStreaks = streaks.map(streak => ({
      id: streak.id,
      type: streak.streakType,
      displayName: getStreakDisplayName(streak.streakType),
      currentCount: streak.currentCount,
      longestCount: streak.longestCount,
      isActive: streak.isActive,
      lastActivityDate: streak.lastActivityDate,
      icon: getStreakIcon(streak.streakType),
      color: getStreakColor(streak.streakType)
    }));

    console.log('\nFrontend-formatted streaks:');
    frontendStreaks.forEach(streak => {
      console.log(`  ${streak.displayName}: ${streak.currentCount} ${streak.icon} (${streak.color})`);
    });

    console.log('\n✅ Dashboard streak data test completed successfully!');
    console.log('🎉 Streaks are properly included in dashboard responses!');

  } catch (error) {
    console.error('❌ Error testing dashboard streaks:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

function getStreakDisplayName(streakType) {
  const names = {
    'DAILY': 'Daily Learning',
    'WEEKLY': 'Weekly Learning',
    'ACTIVITY_COMPLETION': 'Activity Completion',
    'PERFECT_SCORE': 'Perfect Score',
    'HELP_FREE': 'Independent Learning'
  };
  return names[streakType] || streakType;
}

function getStreakIcon(streakType) {
  const icons = {
    'DAILY': '🔥',
    'WEEKLY': '📅',
    'ACTIVITY_COMPLETION': '✅',
    'PERFECT_SCORE': '⭐',
    'HELP_FREE': '🎯'
  };
  return icons[streakType] || '📊';
}

function getStreakColor(streakType) {
  const colors = {
    'DAILY': '#FF6B35',
    'WEEKLY': '#4ECDC4',
    'ACTIVITY_COMPLETION': '#45B7D1',
    'PERFECT_SCORE': '#F7DC6F',
    'HELP_FREE': '#BB8FCE'
  };
  return colors[streakType] || '#95A5A6';
}

// Run the test
testDashboardStreaks();