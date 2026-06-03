const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/reportRoutes");
const contactRoutes = require("./routes/contact");
const paymentRoutes = require("./routes/paymentRoutes");
const reportDownloadRoutes = require("./routes/report");

/* ======================================================
   FIREBASE ADMIN INIT
====================================================== */

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

/* ======================================================
   EXPRESS APP
====================================================== */

const app = express();

/* ======================================================
   CORS
====================================================== */

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      process.env.FRONTEND_URL,
    ],
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
