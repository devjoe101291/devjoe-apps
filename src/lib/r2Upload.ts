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
  if (onProgress) {
    onProgress({ loaded: 0, total: file.size, percentage: 0 });
  }

  // Build object key
  const fileExt = file.name.split('.').pop();
  const r2FileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  try {
    // Step 1: Request presigned PUT URL from backend
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/upload-to-r2/presign`;
    const presignRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: r2FileName,
        contentType: file.type || 'application/octet-stream',
      }),
    });
    if (!presignRes.ok) {
      const errData = await presignRes.json();
      throw new Error(errData.error || 'Failed to get presigned URL');
    }
    const { url: presignedUrl, publicUrl } = await presignRes.json();

    // Step 2: PUT upload direct to R2, using XHR for progress
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.upload.onprogress = function (evt) {
        if (evt.lengthComputable && onProgress) {
          const perc = Math.round((evt.loaded / evt.total) * 100);
          onProgress({ loaded: evt.loaded, total: evt.total, percentage: perc });
        }
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) resolve(null);
        else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      };
      xhr.onerror = function () {
        reject(new Error('Network error uploading file'));
      };
      xhr.send(file);
    });
    if (onProgress) onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    return publicUrl;
  } catch (error: any) {
    console.error('R2 upload error:', error);
    throw new Error(error.message || 'Unknown R2 upload error');
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
