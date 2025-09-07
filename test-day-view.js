const fetch = require('node-fetch');

async function testDayView() {
  try {
    console.log('🧪 Testing day view endpoint...');
    
    // Test with today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Testing with date:', today);
    
    const response = await fetch(`http://localhost:5000/inventory-records?view=day&date=${today}`);
    const data = await response.json();
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`📊 Found ${data.data.length} records for ${today}`);
      if (data.data.length > 0) {
        console.log('📋 Sample record:', data.data[0]);
      }
    } else {
      console.log('❌ Request failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testGenerateMissing() {
  try {
    console.log('\n🧪 Testing generate missing records endpoint...');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Testing with date:', today);
    
    const response = await fetch(`http://localhost:5000/inventory-records/generate-missing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: today }),
    });
    
    const data = await response.json();
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testDayView();
  await testGenerateMissing();
}

runTests();
