import { AuthService } from '../src/modules/auth/services/auth.service';

async function testAuthentication() {
  console.log('🔐 Testing authentication flow...');
  
  try {
    // Test admin login
    console.log('\n👤 Testing admin login...');
    const adminLogin = await AuthService.login({
      email: 'admin@g7.com',
      password: 'Abc123!@#'
    });
    
    console.log('✅ Admin login successful:', adminLogin.user.email);
    console.log('🔑 Admin tokens generated:', !!adminLogin.accessToken && !!adminLogin.refreshToken);
    
    // Test employee login
    console.log('\n👨 Testing employee login...');
    const employeeLogin = await AuthService.login({
      email: 'employee@g7.com',
      password: 'Abc123!@#'
    });
    
    console.log('✅ Employee login successful:', employeeLogin.user.email);
    console.log('🔑 Employee tokens generated:', !!employeeLogin.accessToken && !!employeeLogin.refreshToken);
    
    console.log('\n🎉 Authentication verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    throw error;
  }
}

testAuthentication().catch(console.error);