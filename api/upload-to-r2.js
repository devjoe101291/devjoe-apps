const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

// Helper function to collect stream data
function collectStreamData(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Presigned URL endpoint for direct client-side R2 uploads
async function presignHandler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, contentType } = req.body || {};
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }
    if (!process.env.VITE_R2_ENDPOINT || !process.env.VITE_R2_ACCESS_KEY_ID || !process.env.VITE_R2_SECRET_ACCESS_KEY || !process.env.VITE_R2_BUCKET_NAME) {
      return res.status(500).json({ error: 'R2 config missing' });
    }
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.VITE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
      },
    });
    const command = new PutObjectCommand({
      Bucket: process.env.VITE_R2_BUCKET_NAME,
      Key: fileName,
      ContentType: contentType,
      ACL: undefined // don't set ACL for private buckets
    });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

    const publicUrl = `${process.env.VITE_R2_PUBLIC_URL}/${fileName}`;
    res.status(200).json({ url: presignedUrl, publicUrl });
  } catch (error) {
    console.error("Presign error:", error);
    res.status(500).json({ error: error.message || 'Failed to presign URL' });
  }
}

module.exports = async function handler(request, response) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Route to presign handler if the URL path ends with /presign
  if (request.url && request.url.includes('/presign')) {
    return presignHandler(request, response);
  }

  // Default: Direct upload to R2 (for backward compatibility)
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting R2 upload...');
    console.log('Content-Type:', request.headers['content-type']);
    console.log('Content-Length:', request.headers['content-length']);
    
    // Check if R2 is configured
    if (!process.env.VITE_R2_ENDPOINT || !process.env.VITE_R2_ACCESS_KEY_ID || 
        !process.env.VITE_R2_SECRET_ACCESS_KEY || !process.env.VITE_R2_BUCKET_NAME) {
      console.error('R2 environment variables not configured');
      return response.status(500).json({ 
        error: 'R2 not configured',
        message: 'R2 environment variables are missing. Please configure VITE_R2_ENDPOINT, VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY, and VITE_R2_BUCKET_NAME in your deployment settings.'
      });
    }

    // Get the raw body - streaming for large files
    const buffer = await collectStreamData(request);

    if (!buffer || buffer.length === 0) {
      return response.status(400).json({ error: 'No file data received' });
    }

    console.log('Received file size:', buffer.length, 'bytes');

    // Generate unique filename based on content type
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const contentType = request.headers['content-type'] || 'application/octet-stream';
    
    // Determine file type and folder
    let extension = 'bin';
    let folder = 'uploads';
    
    if (contentType.includes('video/mp4')) {
      extension = 'mp4';
      folder = 'videos/uploads';
    } else if (contentType.includes('video/webm')) {
      extension = 'webm';
      folder = 'videos/uploads';
    } else if (contentType.includes('video/quicktime')) {
      extension = 'mov';
      folder = 'videos/uploads';
    } else if (contentType.includes('apk') || contentType.includes('android')) {
      extension = 'apk';
      folder = 'apps';
    } else if (contentType.includes('exe') || contentType.includes('x-msdownload')) {
      extension = 'exe';
      folder = 'apps';
    } else if (contentType.includes('zip')) {
      extension = 'zip';
      folder = 'apps';
    }
    
    const fileName = `${folder}/${timestamp}_${random}.${extension}`;
    
    console.log('File details:', { contentType, extension, folder, fileName });

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

    response.status(200).json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.error('R2 upload error:', error);
    response.status(500).json({ 
      error: 'Upload failed',
      message: error.message || 'Unknown error'
    });
  }
};

module.exports.presign = presignHandler;