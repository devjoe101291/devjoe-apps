interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload large files to Cloudflare R2 via serverless function
 * This avoids CORS issues by uploading through our API
 */
export const uploadToR2 = async (
  file: File,
  folder: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // Show initial progress
  if (onProgress) {
    onProgress({ loaded: 0, total: file.size, percentage: 0 });
  }

  try {
    // Check if API endpoint exists
    const baseUrl = window.location.origin;
    const testUrl = `${baseUrl}/api/test`;
    const apiUrl = `${baseUrl}/api/upload-to-r2`;
    
    // Debug logging
    console.log('R2 Upload Debug:', {
      testUrl,
      apiUrl,
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name
    });
    
    // Test if API routes are working
    try {
      const testResponse = await fetch(testUrl, { method: 'GET' });
      console.log('API Test Response:', testResponse.status, testResponse.ok);
    } catch (testError) {
      console.warn('API Test Failed:', testError);
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
    }

    const result = await response.json();

    // Show completion
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    if (result.success && result.url) {
      return result.url;
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error: any) {
    console.error('R2 upload error:', error);
    
    // Provide more specific error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Failed to connect to upload service. Please check your internet connection and try again.');
    }
    
    if (error.message?.includes('404')) {
      throw new Error('Upload service not found. The serverless function may still be deploying.');
    }
    
    if (error.message?.includes('413')) {
      throw new Error('File too large. Please compress your file or split it into smaller parts.');
    }
    
    throw new Error(`R2 upload failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Check if R2 is configured
 */
export const isR2Configured = (): boolean => {
  return !!(
    import.meta.env.VITE_R2_ACCESS_KEY_ID &&
    import.meta.env.VITE_R2_SECRET_ACCESS_KEY &&
    import.meta.env.VITE_R2_ENDPOINT &&
    import.meta.env.VITE_R2_BUCKET_NAME &&
    import.meta.env.VITE_R2_PUBLIC_URL
  );
};
