const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectDB() {
  console.log('=== TESTING DIRECT DATABASE QUERIES ===\n');

  try {
    // Test direct grade query
    console.log('📚 Testing direct grade query...');
    const grades = await prisma.gradeLevel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    console.log(`✅ Found ${grades.length} grades directly from DB`);
    if (grades.length > 0) {
      console.log('Sample grades:', grades.slice(0, 3).map(g => `${g.grade}: ${g.displayName}`));
    }

    // Test direct subject query
    console.log('\n📖 Testing direct subject query...');
    const subjects = await prisma.subject.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    console.log(`✅ Found ${subjects.length} subjects directly from DB`);
    if (subjects.length > 0) {
      console.log('Sample subjects:', subjects.slice(0, 3).map(s => `${s.name}: ${s.displayName}`));
    }

    // Test the MasterDataService directly
    console.log('\n🔧 Testing MasterDataService...');
    const { MasterDataService } = require('./src/services/masterDataService');
    const masterDataService = new MasterDataService(prisma);
    
    try {
      const serviceGrades = await masterDataService.getAllGrades();
      console.log(`✅ MasterDataService returned ${serviceGrades.length} grades`);
    } catch (error) {
      console.log('❌ MasterDataService error:', error.message);
    }

    try {
      const serviceSubjects = await masterDataService.getAllSubjects();
      console.log(`✅ MasterDataService returned ${serviceSubjects.length} subjects`);
    } catch (error) {
      console.log('❌ MasterDataService error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectDB();