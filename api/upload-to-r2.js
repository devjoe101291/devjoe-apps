const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting R2 upload...');
    console.log('Content-Type:', request.headers['content-type']);
    console.log('Content-Length:', request.headers['content-length']);

    // Get the raw body - streaming for large files
    const buffer = await collectStreamData(request);

    if (!buffer || buffer.length === 0) {
      return response.status(400).json({ error: 'No file data received' });
    }

    console.log('Received file size:', buffer.length, 'bytes');

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const contentType = request.headers['content-type'] || 'application/octet-stream';
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
;