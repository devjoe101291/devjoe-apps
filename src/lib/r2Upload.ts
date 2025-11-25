import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload large files to Cloudflare R2
 * Files uploaded to R2 are accessible via the public URL
 */
export const uploadToR2 = async (
  file: File,
  folder: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
  const endpoint = import.meta.env.VITE_R2_ENDPOINT;
  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName || !publicUrl) {
    throw new Error("R2 configuration missing. Please check your environment variables.");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const fileName = `${folder}/${timestamp}_${random}.${fileExt}`;

  // Show initial progress
  if (onProgress) {
    onProgress({ loaded: 0, total: file.size, percentage: 0 });
  }

  try {
    // Initialize R2 client with proper configuration
    const r2Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      // Force path-style addressing for R2
      forcePathStyle: false,
    });

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type || 'application/octet-stream',
    });

    await r2Client.send(command);

    // Show completion
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    // Return public URL
    const filePublicUrl = `${publicUrl}/${fileName}`;
    return filePublicUrl;
  } catch (error: any) {
    console.error("R2 upload error:", error);
    // Provide more detailed error message
    if (error.message?.includes('fetch')) {
      throw new Error(`R2 upload failed: Network error. This might be due to CORS restrictions. Please ensure R2 CORS is configured correctly.`);
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
