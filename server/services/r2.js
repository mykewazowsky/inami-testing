const {
  S3Client,
  PutObjectCommand
} = require('@aws-sdk/client-s3');

const crypto = require('crypto');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadPaymentProof(file) {
  if (!file) {
    throw new Error('File upload tidak ditemukan.');
  }

  const extension = file.originalname.split('.').pop();

  const fileName = `payments/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2.send(command);

  return {
    key: fileName,
    url: `${process.env.R2_PUBLIC_BASE_URL}/${fileName}`
  };
}

module.exports = {
  uploadPaymentProof
};