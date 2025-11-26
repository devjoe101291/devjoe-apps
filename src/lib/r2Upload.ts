interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface PartInfo {
  partNumber: number;
  etag: string;
}

interface MultipartUploadConfig {
  chunkSize?: number;
  concurrentUploads?: number;
}

const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_CONCURRENT_UPLOADS = 3;

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
        else {
          const errorMsg = `Upload failed: ${xhr.status} ${xhr.statusText}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        }
      };
      xhr.onerror = function () {
        const errorMsg = 'Network error uploading file';
        console.error(errorMsg);
        reject(new Error(errorMsg));
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
 * Upload large files to Cloudflare R2 using multipart upload
 * Supports resumable uploads and handles large files efficiently
 */
export const uploadToR2Multipart = async (
  file: File,
  folder: string,
  onProgress?: (progress: UploadProgress) => void,
  config?: MultipartUploadConfig
): Promise<string> => {
  const chunkSize = config?.chunkSize || DEFAULT_CHUNK_SIZE;
  const concurrentUploads = config?.concurrentUploads || DEFAULT_CONCURRENT_UPLOADS;
  
  if (onProgress) {
    onProgress({ loaded: 0, total: file.size, percentage: 0 });
  }

  // Build object key
  const fileExt = file.name.split('.').pop();
  const r2FileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  let uploadId: string | null = null;
  
  try {
    // Step 1: Initiate multipart upload
    const baseUrl = window.location.origin;
    const initiateRes = await fetch(`${baseUrl}/api/upload-to-r2-initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: r2FileName,
        contentType: file.type || 'application/octet-stream',
      }),
    });

    if (!initiateRes.ok) {
      const errData = await initiateRes.json();
      throw new Error(errData.error || 'Failed to initiate multipart upload');
    }

    const initiateData = await initiateRes.json();
    uploadId = initiateData.uploadId;
    
    // Step 2: Split file into parts and upload concurrently
    const totalParts = Math.ceil(file.size / chunkSize);
    const uploadedParts: PartInfo[] = [];
    let uploadedBytes = 0;

    // Process parts in batches to control concurrency
    for (let startPart = 0; startPart < totalParts; startPart += concurrentUploads) {
      const endPart = Math.min(startPart + concurrentUploads, totalParts);
      const batchPromises: Promise<PartInfo>[] = [];

      for (let partIndex = startPart; partIndex < endPart; partIndex++) {
        const startByte = partIndex * chunkSize;
        const endByte = Math.min(startByte + chunkSize, file.size);
        const part = file.slice(startByte, endByte);
        const partNumber = partIndex + 1;

        batchPromises.push(uploadPart(part, partNumber, uploadId, r2FileName, (loaded) => {
          // Update progress for this part
          uploadedBytes += loaded;
          if (onProgress) {
            const percentage = Math.round((uploadedBytes / file.size) * 100);
            onProgress({ loaded: uploadedBytes, total: file.size, percentage });
          }
        }));
      }

      // Wait for all parts in this batch to complete
      try {
        const batchResults = await Promise.all(batchPromises);
        uploadedParts.push(...batchResults);
      } catch (error) {
        // If any part fails, abort the multipart upload
        if (uploadId) {
          await abortMultipartUpload(r2FileName, uploadId);
        }
        throw error;
      }
    }

    // Step 3: Complete multipart upload
    const completeRes = await fetch(`${baseUrl}/api/upload-to-r2-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: r2FileName,
        uploadId,
        parts: uploadedParts,
      }),
    });

    if (!completeRes.ok) {
      const errData = await completeRes.json();
      throw new Error(errData.error || 'Failed to complete multipart upload');
    }

    const { publicUrl } = await completeRes.json();
    
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }
    
    return publicUrl;
  } catch (error: any) {
    console.error('R2 multipart upload error:', error);
    throw new Error(error.message || 'Unknown R2 multipart upload error');
  }
};

/**
 * Upload a single part of a multipart upload
 */
const uploadPart = async (
  part: Blob,
  partNumber: number,
  uploadId: string,
  fileName: string,
  onProgress: (loaded: number) => void
): Promise<PartInfo> => {
  const baseUrl = window.location.origin;
  const uploadPartRes = await fetch(`${baseUrl}/api/upload-to-r2-part`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      uploadId,
      partNumber,
    }),
  });

  if (!uploadPartRes.ok) {
    const errData = await uploadPartRes.json();
    throw new Error(errData.error || `Failed to get upload URL for part ${partNumber}`);
  }

  const { url: uploadUrl } = await uploadPartRes.json();

  // Upload the part data
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    
    xhr.upload.onprogress = function (evt) {
      if (evt.lengthComputable) {
        onProgress(evt.loaded);
      }
    };
    
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Extract ETag from response headers
        const etag = xhr.getResponseHeader('ETag') || '';
        if (!etag) {
          reject(new Error(`Failed to get ETag for part ${partNumber}`));
          return;
        }
        resolve({ partNumber, etag });
      } else {
        const errorMsg = `Part ${partNumber} upload failed: ${xhr.status} ${xhr.statusText}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }
    };
    
    xhr.onerror = function () {
      const errorMsg = `Network error uploading part ${partNumber}`;
      console.error(errorMsg);
      reject(new Error(errorMsg));
    };
    
    xhr.send(part);
  });
};

/**
 * Abort a multipart upload to clean up resources
 */
const abortMultipartUpload = async (
  fileName: string,
  uploadId: string
): Promise<void> => {
  try {
    const baseUrl = window.location.origin;
    await fetch(`${baseUrl}/api/upload-to-r2-abort`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        uploadId,
      }),
    });
  } catch (error) {
    console.warn('Failed to abort multipart upload:', error);
  }
};

/**
 * Get R2 configuration
 */
const getR2Config = () => {
  // @ts-ignore - import.meta.env is available in Vite
  return {
    endpoint: import.meta.env.VITE_R2_ENDPOINT,
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
    bucketName: import.meta.env.VITE_R2_BUCKET_NAME,
    publicUrl: import.meta.env.VITE_R2_PUBLIC_URL,
  };
};

/**
 * Check if R2 is configured
 */
export const isR2Configured = (): boolean => {
  const config = getR2Config();
  
  console.log('R2 Environment Variables Check:', {
    hasEndpoint: !!config.endpoint,
    hasAccessKeyId: !!config.accessKeyId,
    hasSecretAccessKey: !!config.secretAccessKey,
    hasBucketName: !!config.bucketName,
    hasPublicUrl: !!config.publicUrl,
    endpoint: config.endpoint ? `${config.endpoint.substring(0, 30)}...` : 'MISSING',
  });
  
  return !!(
    config.endpoint &&
    config.accessKeyId &&
    config.secretAccessKey &&
    config.bucketName &&
    config.publicUrl
  );
};

/**
 * Create S3 client for R2
 */
const createS3Client = () => {
  const config = getR2Config();
  
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  });
};