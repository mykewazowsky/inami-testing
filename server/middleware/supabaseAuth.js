const supabase = require("../supabase");

async function authenticateSupabaseToken(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ message: "Database tidak aktif di environment ini." });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan." });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Token tidak valid atau sudah expired." });
    }

    req.supabaseUser = user;
    next();
  } catch (err) {
    console.error("authenticateSupabaseToken error:", err);
    return res.status(401).json({ message: "Gagal memverifikasi token." });
  }
}

module.exports = { authenticateSupabaseToken };
