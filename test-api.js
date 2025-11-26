// Simple test script to check if the API route is working
async function testApiRoute() {
  try {
    const response = await fetch('https://devjoe-showcase-studio.vercel.app/api/upload-to-r2', {
      method: 'OPTIONS'
    });
    
    console.log('API Route Test Results:');
    console.log('- Status:', response.status);
    console.log('- OK:', response.ok);
    console.log('- Headers:', [...response.headers.entries()]);
    
    return response.ok;
  } catch (error) {
    console.error('API Route Test Failed:', error);
    return false;
  }
}

testApiRoute().then(result => {
  console.log('Test Result:', result ? '✅ SUCCESS' : '❌ FAILED');
});