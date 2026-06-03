const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: 'Token tidak ditemukan.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token tidak valid atau expired.',
    });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({
        message: 'Role user tidak ditemukan.',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Akses ditolak. Hanya admin dan mitra yang boleh mengunduh report.',
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};