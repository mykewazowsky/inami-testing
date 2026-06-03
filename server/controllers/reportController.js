const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const REPORTS = {
  cilacap: {
    key: process.env.R2_REPORT_KEY_CILACAP || 'DUMMY-INAMI-CLP-2026-001.pdf',
    downloadName: 'Report-Cilacap.pdf',
    errorMessage: 'Gagal mengunduh report Cilacap.',
  },
  bakauheni: {
    key: process.env.R2_REPORT_KEY_BAKAUHENI || 'DUMMY-INAMI-BKH-2026-001.pdf',
    downloadName: 'Report-Bakauheni.pdf',
    errorMessage: 'Gagal mengunduh report Bakauheni.',
  },
};

async function streamReport(res, key, downloadName) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  });

  const result = await r2.send(command);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Cache-Control', 'no-store');

  if (result.ContentLength) {
    res.setHeader('Content-Length', String(result.ContentLength));
  }

  if (!result.Body || typeof result.Body.pipe !== 'function') {
    throw new Error('Body file dari R2 tidak valid.');
  }

  result.Body.on('error', (err) => {
    console.error('Stream R2 error:', err);
    if (!res.headersSent) {
      res.status(500).end('Gagal membaca stream PDF.');
    } else {
      res.end();
    }
  });

  result.Body.pipe(res);
}

async function downloadCilacapReport(req, res) {
  const { role, wilayah } = req.user; // dari JWT yang sudah di-decode middleware

  if (role !== 'admin' && wilayah !== 'cilacap') {
    return res.status(403).json({ 
      message: 'Akses ditolak. Anda hanya dapat mengunduh laporan wilayah Anda.' 
    });
  }
  try {
    await streamReport(
      res,
      REPORTS.cilacap.key,
      REPORTS.cilacap.downloadName
    );
  } catch (error) {
    console.error('downloadCilacapReport error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: REPORTS.cilacap.errorMessage,
      });
    }
  }
}

async function downloadBakauheniReport(req, res) {
  const { role, wilayah } = req.user;

  if (role !== 'admin' && wilayah !== 'bakauheni') {
    return res.status(403).json({ 
      message: 'Akses ditolak. Anda hanya dapat mengunduh laporan wilayah Anda.' 
    });
  }
  try {
    await streamReport(
      res,
      REPORTS.bakauheni.key,
      REPORTS.bakauheni.downloadName
    );
  } catch (error) {
    console.error('downloadBakauheniReport error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: REPORTS.bakauheni.errorMessage,
      });
    }
  }
}

module.exports = {
  downloadCilacapReport,
  downloadBakauheniReport,
};