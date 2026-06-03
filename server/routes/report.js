const express = require('express');
const router = express.Router();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const REPORT_KEYS = {
  cilacap: process.env.R2_REPORT_KEY_CILACAP,
  bakauheni: process.env.R2_REPORT_KEY_BAKAUHENI,
};

router.get('/download/:reportId', async (req, res) => {
  const { reportId } = req.params;

  const key = REPORT_KEYS[reportId];
  if (!key) {
    return res.status(404).json({ message: 'Report tidak ditemukan.' });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    return res.json({ url: signedUrl });
  } catch (err) {
    console.error('Error generate signed URL:', err);
    return res.status(500).json({ message: 'Gagal generate link download.' });
  }
});

module.exports = router;