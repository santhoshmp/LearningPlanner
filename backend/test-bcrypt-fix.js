const bcrypt = require('bcrypt');

async function testBcrypt() {
  try {
    console.log('Testing bcrypt functionality...');
    
    const password = 'test123';
    const hash = await bcrypt.hash(password, 12);
    console.log('Hash created:', hash);
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('Password verification:', isValid);
    
    if (isValid) {
      console.log('✅ bcrypt is working correctly!');
    } else {
      console.log('❌ bcrypt verification failed');
    }
  } catch (error) {
    console.error('❌ bcrypt error:', error.message);
  }
}

testBcrypt();