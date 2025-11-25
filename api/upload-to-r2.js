const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

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
    // Get the raw body
    const chunks = [];
    
    // Handle stream data
    request.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    request.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      if (!buffer || buffer.length === 0) {
        return response.status(400).json({ error: 'No file data received' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const contentType = request.headers['content-type'] || 'application/octet-stream';
      const extension = contentType.includes('apk') ? 'apk' : 
                       contentType.includes('exe') ? 'exe' :
                       contentType.includes('zip') ? 'zip' : 'bin';
      const fileName = `apps/${timestamp}_${random}.${extension}`;

      try {
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
      } catch (uploadError) {
        console.error('R2 upload error:', uploadError);
        response.status(500).json({ 
          error: 'Upload failed',
          message: uploadError.message || 'Unknown error'
        });
      }
    });
  } catch (error) {
    console.error('R2 upload error:', error);
    response.status(500).json({ 
      error: 'Upload failed',
      message: error.message || 'Unknown error'
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
    sizeLimit: '500mb',
  },
};