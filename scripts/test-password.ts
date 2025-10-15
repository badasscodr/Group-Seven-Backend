import bcrypt from 'bcryptjs';

// Test password hash
const password = 'Abc123!@#';
const storedHash = '$2b$12$LQAv3Lw9zmGFbAWnJ5I8y0s7F9pL6wG9Ndmv4hvtZT2Zr5BcG';

console.log('🔐 Testing Password Hash');
console.log('Password:', password);
console.log('Stored Hash:', storedHash);

bcrypt.compare(password, storedHash, (err, result) => {
  if (err) {
    console.error('❌ Bcrypt error:', err);
  } else {
    console.log('✅ Password verification result:', result);
  }
  
  // Test creating a new hash
  bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
      console.error('❌ Hash error:', err);
    } else {
      console.log('🔐 Generated new hash:', hash);
      
      // Test the new hash
      bcrypt.compare(password, hash, (err, result) => {
        if (err) {
          console.error('❌ Verification error:', err);
        } else {
          console.log('✅ New hash verification result:', result);
        }
      });
    }
  });
});