/**
 * Direct R2 upload using CORS (no credentials in code)
 * 
 * SETUP REQUIRED:
 * 1. Configure R2 bucket CORS in Cloudflare Dashboard
 * 2. Make bucket public for uploads (with restrictions)
 * 3. Set up R2 bucket policies to limit uploads
 */

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload file directly to R2 using public bucket access
 * This requires R2 bucket to be configured with CORS and public write access
 * 
 * NOTE: This is ONLY secure if you set up R2 bucket policies to:
 * - Limit file sizes
 * - Restrict file types
 * - Rate limit uploads
 * - Set expiration for uploads
 */
export const uploadToR2Direct = async (
  file: File,
  folder: string,
  bucketUrl: string, // e.g., 'https://your-bucket.r2.cloudflarestorage.com'
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  if (onProgress) {
    onProgress({ loaded: 0, total: file.size, percentage: 0 });
  }

  // Build object key
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const uploadUrl = `${bucketUrl}/${fileName}`;

  try {
    // Direct PUT to R2 using CORS
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      
      xhr.upload.onprogress = function (evt) {
        if (evt.lengthComputable && onProgress) {
          const perc = Math.round((evt.loaded / evt.total) * 100);
          onProgress({ loaded: evt.loaded, total: evt.total, percentage: perc });
        }
      };
      
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(null);
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function () {
        reject(new Error('Network error uploading file'));
      };
      
      xhr.send(file);
    });

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    // Return public URL
    return uploadUrl;
  } catch (error: any) {
    console.error('R2 direct upload error:', error);
    throw new Error(error.message || 'Unknown R2 upload error');
  }
};

/**
 * ⚠️ WARNING: This exposes R2 credentials in frontend code
 * Only use for development/testing - NEVER in production
 */
export const uploadToR2WithCredentials = async (
  file: File,
  folder: string,
  config: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  },
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  console.warn('⚠️ WARNING: Using hardcoded credentials is insecure!');
  
  // This would require AWS SDK in the browser
  // which exposes your credentials in the bundle
  throw new Error('This method is intentionally disabled for security reasons. Use backend API instead.');
};
