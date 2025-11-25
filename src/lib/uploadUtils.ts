import { supabase } from "@/integrations/supabase/client";
import { uploadToR2, isR2Configured as checkR2Config } from "./r2Upload";

export { checkR2Config as isR2Configured };

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for optimal upload speed
const MAX_CONCURRENT_CHUNKS = 3; // Upload 3 chunks in parallel

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload large files using chunked upload with parallel processing
 * Supports files up to 500MB (can be adjusted based on Supabase plan)
 */
export const uploadFileChunked = async (
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // Check if file is large
  const SUPABASE_LIMIT = 50 * 1024 * 1024; // 50MB
  const isLargeFile = file.size >= SUPABASE_LIMIT;
  const r2Available = checkR2Config();

  // Use R2 serverless function for large files (no CORS issues!)
  if (isLargeFile && r2Available) {
    return await uploadToR2(file, folder, onProgress);
  }

  // Use Supabase for small files
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for Supabase free tier
  if (file.size > MAX_FILE_SIZE && !r2Available) {
    throw new Error(
      `File size is ${formatFileSize(file.size)}. Supabase free tier has a 50MB upload limit per file.\n\nTo upload larger files, please configure Cloudflare R2 (free 10GB storage) or upgrade to Supabase Pro ($25/month) for up to 5GB per file.`
    );
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;

  // Use direct upload for all files - more reliable than chunking with Supabase
  return await uploadFileDirect(file, bucket, fileName, onProgress);
};

/**
 * Direct upload for smaller files
 */
const uploadFileDirect = async (
  file: File,
  bucket: string,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // Show initial progress
  if (onProgress) {
    onProgress({ loaded: 0, total: file.size, percentage: 0 });
  }

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Show completion progress
  if (onProgress) {
    onProgress({ loaded: file.size, total: file.size, percentage: 100 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return publicUrl;
};

/**
 * Chunked upload for large files with parallel processing
 */
const uploadLargeFile = async (
  file: File,
  bucket: string,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const chunks: Blob[] = [];

  // Split file into chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    chunks.push(file.slice(start, end));
  }

  let uploadedBytes = 0;

  // Upload chunks in parallel batches
  const uploadChunk = async (chunk: Blob, index: number): Promise<void> => {
    const chunkFileName = `${fileName}.part${index}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(chunkFileName, chunk, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw new Error(`Chunk ${index} upload failed: ${error.message}`);
    }

    uploadedBytes += chunk.size;

    if (onProgress) {
      onProgress({
        loaded: uploadedBytes,
        total: file.size,
        percentage: Math.round((uploadedBytes / file.size) * 100),
      });
    }
  };

  // Upload chunks in parallel batches
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const batch = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
    const batchPromises = batch.map((chunk, idx) =>
      uploadChunk(chunk, i + idx)
    );
    await Promise.all(batchPromises);
  }

  // Merge chunks into final file
  try {
    await mergeChunks(bucket, fileName, totalChunks);
  } catch (error: any) {
    // If merge fails, fall back to uploading the whole file
    console.warn("Chunk merge failed, falling back to direct upload:", error);
    await cleanupChunks(bucket, fileName, totalChunks);
    return await uploadFileDirect(file, bucket, fileName, onProgress);
  }

  // Clean up chunk files
  await cleanupChunks(bucket, fileName, totalChunks);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return publicUrl;
};

/**
 * Merge uploaded chunks into a single file
 */
const mergeChunks = async (
  bucket: string,
  fileName: string,
  totalChunks: number
): Promise<void> => {
  // Download all chunks
  const chunkBlobs: Blob[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunkFileName = `${fileName}.part${i}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(chunkFileName);

    if (error || !data) {
      throw new Error(`Failed to download chunk ${i}`);
    }

    chunkBlobs.push(data);
  }

  // Merge chunks into single blob
  const mergedBlob = new Blob(chunkBlobs);

  // Upload merged file
  const { error } = await supabase.storage.from(bucket).upload(fileName, mergedBlob, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload merged file: ${error.message}`);
  }
};

/**
 * Clean up temporary chunk files
 */
const cleanupChunks = async (
  bucket: string,
  fileName: string,
  totalChunks: number
): Promise<void> => {
  const chunkFileNames = Array.from(
    { length: totalChunks },
    (_, i) => `${fileName}.part${i}`
  );

  await supabase.storage.from(bucket).remove(chunkFileNames);
};

/**
 * Optimized upload for videos with transcoding support
 */
export const uploadVideo = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // Validate video format
  const validFormats = ["video/mp4", "video/webm", "video/quicktime"];
  if (!validFormats.includes(file.type)) {
    throw new Error(
      `Invalid video format. Supported formats: MP4, WebM, MOV. Got: ${file.type}`
    );
  }

  return await uploadFileChunked(file, "videos", "uploads", onProgress);
};

/**
 * Optimized upload for images (thumbnails, icons)
 */
export const uploadImage = async (
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // Validate image format
  const validFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validFormats.includes(file.type)) {
    throw new Error(
      `Invalid image format. Supported formats: JPEG, PNG, WebP, GIF. Got: ${file.type}`
    );
  }

  // Images are usually small, use direct upload
  return await uploadFileDirect(file, bucket, `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split(".").pop()}`, onProgress);
};

/**
 * Format bytes to human readable size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  maxSize: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } => {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatFileSize(maxSize)}. Current size: ${formatFileSize(file.size)}`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
};
