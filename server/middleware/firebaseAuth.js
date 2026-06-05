// Firebase telah digantikan oleh Supabase. Middleware ini dinonaktifkan.
async function authenticateFirebaseToken(req, res, next) {
  return res.status(503).json({ message: "Firebase tidak aktif. Gunakan Supabase auth." });
}

module.exports = { authenticateFirebaseToken };
