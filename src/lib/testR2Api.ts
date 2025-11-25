// Test file to verify R2 API route is working
// This is a simple test file that can be used to verify the API endpoint

export const testR2Upload = async () => {
  try {
    // Test if the API endpoint exists
    const response = await fetch('/api/upload-to-r2', {
      method: 'OPTIONS'
    });
    
    console.log('API Route Test:', {
      status: response.status,
      ok: response.ok,
      headers: [...response.headers.entries()]
    });
    
    return response.ok;
  } catch (error) {
    console.error('API Route Test Failed:', error);
    return false;
  }
};

// Run the test
if (typeof window !== 'undefined') {
  testR2Upload().then(result => {
    console.log('R2 API Route Test Result:', result ? '✅ Working' : '❌ Not Working');
  });
}