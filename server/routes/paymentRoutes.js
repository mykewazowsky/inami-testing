const express = require('express');
const multer = require('multer');

const {
  submitPayment,
  submitDirectRequest,
  downloadDataSecure
} = require('../controllers/paymentController');

const {
  authenticateFirebaseToken
} = require('../middleware/firebaseAuth');

const router = express.Router();

/* ======================================================
   MULTER MEMORY STORAGE
====================================================== */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Format file tidak didukung.'));
    }

    cb(null, true);
  }
});

/* ======================================================
   PAYMENT SUBMISSION
====================================================== */

router.post(
  '/submit',
  upload.single('paymentProof'),
  submitPayment
);

/* ======================================================
   DIRECT REQUEST
====================================================== */

router.post(
  '/direct-request',
  authenticateFirebaseToken,
  submitDirectRequest
);

/* ======================================================
   SECURE DOWNLOAD
====================================================== */

router.post(
  '/secure-download',
  authenticateFirebaseToken,
  downloadDataSecure
);

module.exports = router;