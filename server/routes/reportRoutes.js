const express = require('express');
const router = express.Router();

const {
  downloadCilacapReport,
  downloadBakauheniReport,
} = require('../controllers/reportController');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

router.get(
  '/cilacap',
  authenticateToken,
  authorizeRoles('admin', 'mitra'),
  downloadCilacapReport
);

router.get(
  '/bakauheni',
  authenticateToken,
  authorizeRoles('admin', 'mitra'),
  downloadBakauheniReport
);

module.exports = router;
