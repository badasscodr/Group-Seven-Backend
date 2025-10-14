require('dotenv').config();

async function testSupplierLoginEndpoint() {
  try {
    console.log('🌐 Testing supplier login endpoint directly...');
    
    const response = await fetch('http://localhost:8000/api/auth/login/supplier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testsupplier@example.com',
        password: 'test123456'
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.ok) {
      console.log('✅ Supplier login endpoint working!');
    } else {
      console.log('❌ Supplier login endpoint failed');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testSupplierLoginEndpoint();