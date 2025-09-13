#!/usr/bin/env node

/**
 * Debug script for dashboard API issues
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDashboard() {
  console.log('🔍 Debugging Dashboard API...\n');

  try {
    // Step 1: Check if child exists
    const childProfile = await prisma.childProfile.findFirst({
      where: { isActive: true }
    });

    if (!childProfile) {
      console.log('❌ No child profile found');
      return;
    }

    console.log(`✅ Child found: ${childProfile.name} (${childProfile.id})`);

    // Step 2: Check if childProgressService methods exist
    console.log('\n2. Checking childProgressService...');
    try {
      // Import the compiled JavaScript version
      const { childProgressService } = require('./dist/services/childProgressService');
      console.log('✅ childProgressService imported');

      // Test generateProgressSummary
      console.log('Testing generateProgressSummary...');
      const progressSummary = await childProgressService.generateProgressSummary(childProfile.id);
      console.log('✅ generateProgressSummary works');
      console.log('Progress summary keys:', Object.keys(progressSummary));

    } catch (error) {
      console.log('❌ Error with childProgressService:', error.message);
      console.log('Trying alternative import...');
      
      try {
        // Try importing the TypeScript file directly (if ts-node is available)
        const { childProgressService } = require('./src/services/childProgressService.ts');
        console.log('✅ childProgressService imported (TS)');
        
        const progressSummary = await childProgressService.generateProgressSummary(childProfile.id);
        console.log('✅ generateProgressSummary works');
        console.log('Progress summary keys:', Object.keys(progressSummary));
      } catch (tsError) {
        console.log('❌ TypeScript import also failed:', tsError.message);
      }
    }

    // Step 3: Check if childBadgeService methods exist
    console.log('\n3. Checking childBadgeService...');
    try {
      // Import the compiled JavaScript version
      const { ChildBadgeService } = require('./dist/services/childBadgeService');
      const childBadgeService = new ChildBadgeService(prisma);
      console.log('✅ ChildBadgeService imported');

      // Test getBadgeProgress
      console.log('Testing getBadgeProgress...');
      const badgeProgress = await childBadgeService.getBadgeProgress(childProfile.id);
      console.log('✅ getBadgeProgress works');
      console.log('Badge progress:', badgeProgress);

    } catch (error) {
      console.log('❌ Error with childBadgeService:', error.message);
      console.log('Trying alternative import...');
      
      try {
        // Try importing the TypeScript file directly
        const { ChildBadgeService } = require('./src/services/childBadgeService.ts');
        const childBadgeService = new ChildBadgeService(prisma);
        console.log('✅ ChildBadgeService imported (TS)');
        
        const badgeProgress = await childBadgeService.getBadgeProgress(childProfile.id);
        console.log('✅ getBadgeProgress works');
        console.log('Badge progress:', badgeProgress);
      } catch (tsError) {
        console.log('❌ TypeScript import also failed:', tsError.message);
      }
    }

    // Step 4: Check study plans query
    console.log('\n4. Checking study plans query...');
    try {
      const studyPlans = await prisma.studyPlan.findMany({
        where: { childId: childProfile.id },
        include: {
          activities: {
            include: {
              progressRecords: {
                where: { childId: childProfile.id }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`✅ Found ${studyPlans.length} study plans`);
      if (studyPlans.length > 0) {
        console.log('First plan:', {
          id: studyPlans[0].id,
          subject: studyPlans[0].subject,
          status: studyPlans[0].status,
          activitiesCount: studyPlans[0].activities.length
        });
      }

    } catch (error) {
      console.log('❌ Error with study plans query:', error.message);
    }

    // Step 5: Check learning streaks
    console.log('\n5. Checking learning streaks...');
    try {
      const streaks = await prisma.learningStreak.findMany({
        where: { childId: childProfile.id }
      });

      console.log(`✅ Found ${streaks.length} learning streaks`);

    } catch (error) {
      console.log('❌ Error with learning streaks query:', error.message);
    }

    // Step 6: Check achievements
    console.log('\n6. Checking achievements...');
    try {
      const achievements = await prisma.achievement.findMany({
        where: { childId: childProfile.id },
        orderBy: { earnedAt: 'desc' },
        take: 5
      });

      console.log(`✅ Found ${achievements.length} achievements`);

    } catch (error) {
      console.log('❌ Error with achievements query:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
if (require.main === module) {
  debugDashboard();
}

module.exports = { debugDashboard };