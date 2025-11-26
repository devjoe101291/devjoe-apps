import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Get R2 configuration from environment variables
 */
const getR2Config = () => {
  // @ts-ignore
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
  
  console.log('R2 Direct Upload - Configuration Check:', {
    hasEndpoint: !!config.endpoint,
    hasAccessKeyId: !!config.accessKeyId,
    hasSecretAccessKey: !!config.secretAccessKey,
    hasBucketName: !!config.bucketName,
    hasPublicUrl: !!config.publicUrl,
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
 * Create S3 client for R2 with browser credentials
 * WARNING: This exposes credentials in the browser - for testing only!
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

/**
 * Upload file directly to R2 from browser using AWS SDK
 * Automatically handles multipart upload for large files
 */
export const uploadToR2Direct = async (
  file: File,
  folder: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const config = getR2Config();
  
  if (!isR2Configured()) {
    throw new Error('R2 is not configured. Please check environment variables.');
  }
  
  const s3Client = createS3Client();
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const fileExt = file.name.split('.').pop();
  const r2FileName = `${folder}/${timestamp}_${randomStr}.${fileExt}`;
  
  console.log('Starting direct R2 upload:', {
    fileName: r2FileName,
    fileSize: file.size,
    fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    useMultipart: file.size > CHUNK_SIZE,
  });
  
  try {
    // Use AWS SDK's Upload class which handles multipart automatically
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.bucketName!,
        Key: r2FileName,
        Body: file,
        ContentType: file.type || 'application/octet-stream',
      },
      queueSize: MAX_CONCURRENT_UPLOADS,
      partSize: CHUNK_SIZE,
      leavePartsOnError: false, // Clean up on error
    });
    
    // Track upload progress
    upload.on('httpUploadProgress', (progress) => {
      if (onProgress && progress.loaded && progress.total) {
        const percentage = (progress.loaded / progress.total) * 100;
        onProgress({
          loaded: progress.loaded,
          total: progress.total,
          percentage,
        });
        
        console.log(`Upload progress: ${percentage.toFixed(1)}% (${(progress.loaded / 1024 / 1024).toFixed(2)} MB / ${(progress.total / 1024 / 1024).toFixed(2)} MB)`);
      }
    });
    
    // Execute upload
    await upload.done();
    
    const publicUrl = `${config.publicUrl}/${r2FileName}`;
    console.log('✅ Upload completed successfully:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ R2 direct upload error:', error);
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
