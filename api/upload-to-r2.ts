import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Collect raw body data
    const chunks: Buffer[] = [];
    
    // Handle stream data
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No file data received' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const extension = contentType.includes('apk') ? 'apk' : 
                     contentType.includes('exe') ? 'exe' :
                     contentType.includes('zip') ? 'zip' : 'bin';
    const fileName = `apps/${timestamp}_${random}.${extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.VITE_R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `${process.env.VITE_R2_PUBLIC_URL}/${fileName}`;

    res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error: any) {
    console.error('R2 upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message || 'Unknown error'
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for raw data
    sizeLimit: '500mb',
  },
};
