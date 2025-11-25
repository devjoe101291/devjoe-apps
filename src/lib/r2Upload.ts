import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Initialize R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload large files to Cloudflare R2
 * Files uploaded to R2 are accessible via the public URL
 */
export const uploadToR2 = async (
  file: File,
  folder: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

  if (!bucketName || !publicUrl) {
    throw new Error("R2 configuration missing. Please check your .env file.");
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
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
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
    throw new Error(`R2 upload failed: ${error.message}`);
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
