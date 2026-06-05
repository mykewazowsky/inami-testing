const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/reportRoutes");
const contactRoutes = require("./routes/contact");
const paymentRoutes = require("./routes/paymentRoutes");
const reportDownloadRoutes = require("./routes/report");
const geodataRoutes = require("./routes/geodataRoutes");

/* ======================================================
   EXPRESS APP
====================================================== */

const app = express();

/* ======================================================
   CORS
====================================================== */

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (curl, Postman, Railway health check)
      if (!origin) return callback(null, true);
      // Izinkan semua subdomain vercel.app untuk fleksibilitas deploy
      if (origin.endsWith(".vercel.app") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

/* ======================================================
   MIDDLEWARE
====================================================== */

app.use(express.json());

/* ======================================================
   ROOT
====================================================== */

app.get("/", (req, res) => {
  res.send("INAMI backend is running");
});

/* ======================================================
   ROUTES
====================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/report", reportDownloadRoutes);
app.use("/api/geodata", geodataRoutes);

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */

app.use((err, req, res, next) => {
  if (err) {
    console.error("Global error:", err);

    if (err.message === "Format file tidak didukung.") {
      return res.status(400).json({
        message: "Format file tidak didukung. Gunakan JPG, PNG, atau PDF.",
      });
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Ukuran file maksimal 5 MB.",
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
    });
  }

  next();
});

/* ======================================================
   START SERVER
====================================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
