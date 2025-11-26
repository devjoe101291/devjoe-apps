const { S3Client, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');

module.exports = async function handler(req, res) {
  // Enable CORS
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
    const { fileName, uploadId, parts } = req.body || {};
    if (!fileName || !uploadId || !parts) {
      return res.status(400).json({ error: 'fileName, uploadId, and parts are required' });
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
    
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.VITE_R2_BUCKET_NAME,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part) => ({
          ETag: part.etag,
          PartNumber: part.partNumber,
        })).sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });
    
    const response = await s3Client.send(command);
    
    const publicUrl = `${process.env.VITE_R2_PUBLIC_URL}/${fileName}`;
    
    res.status(200).json({ 
      publicUrl,
      location: response.Location,
    });
  } catch (error) {
    console.error("Complete multipart error:", error);
    res.status(500).json({ error: error.message || 'Failed to complete multipart upload' });
  }
};
