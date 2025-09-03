import { PrismaClient } from '@prisma/client';
import { MasterDataSeedingService } from '../src/services/masterDataSeedingService';

const prisma = new PrismaClient();
const seedingService = new MasterDataSeedingService(prisma);

async function main() {
  console.log('Starting comprehensive database seeding...');

  // 1. Seed master data first
  console.log('Seeding master data...');
  const masterDataResult = await seedingService.seedMasterData({
    includeGrades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    includeSubjects: ['mathematics', 'science', 'english-language-arts', 'social-studies', 'visual-arts', 'music', 'physical-education'],
    resourcesPerTopic: 5,
    validateResources: true,
    clearExisting: false
  });

  if (masterDataResult.success) {
    console.log('✅ Master data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Grades: ${masterDataResult.summary.grades}`);
    console.log(`   - Subjects: ${masterDataResult.summary.subjects}`);
    console.log(`   - Topics: ${masterDataResult.summary.topics}`);
    console.log(`   - Resources: ${masterDataResult.summary.resources}`);
  } else {
    console.error('❌ Master data seeding failed:');
    masterDataResult.errors.forEach(error => console.error(`   - ${error}`));
  }

  // 2. Seed user settings
  console.log('Seeding user settings...');
  
  // Get all existing users to create default settings
  const users = await prisma.user.findMany({
    include: {
      settings: true,
      children: {
        include: {
          settings: true
        }
      }
    }
  });

  console.log(`Found ${users.length} users to process`);

  // Create default user settings for users who don't have them
  for (const user of users) {
    if (!user.settings) {
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: true,
          privacyLevel: 'standard',
          dataSharingConsent: false
        }
      });
      console.log(`Created default settings for user ${user.id}`);
    }

    // Create default child settings for children who don't have them
    for (const child of user.children) {
      if (!child.settings) {
        await prisma.childSettings.create({
          data: {
            childId: child.id,
            contentFilterLevel: 'moderate',
            sessionTimeLimit: 60,
            breakReminders: true,
            parentalNotifications: true,
            aiAssistanceEnabled: true,
            videoAutoplay: false
          }
        });
        console.log(`Created default settings for child ${child.id}`);
      }
    }
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });