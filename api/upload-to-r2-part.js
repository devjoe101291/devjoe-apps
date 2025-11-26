const { S3Client, UploadPartCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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
    const { fileName, uploadId, partNumber } = req.body || {};
    if (!fileName || !uploadId || !partNumber) {
      return res.status(400).json({ error: 'fileName, uploadId, and partNumber are required' });
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
    
    const command = new UploadPartCommand({
      Bucket: process.env.VITE_R2_BUCKET_NAME,
      Key: fileName,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
    
    res.status(200).json({ url: presignedUrl });
  } catch (error) {
    console.error("Upload part error:", error);
    res.status(500).json({ error: error.message || 'Failed to get upload part URL' });
  }
};
