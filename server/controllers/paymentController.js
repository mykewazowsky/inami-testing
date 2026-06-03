const { uploadPaymentProof } = require("../services/r2");
const db = require("../db");
const fs = require("fs");
const path = require("path");
const { sendPaymentSubmissionEmail } = require("../mailer");

const DATASET_FILE_MAP = {
  cilacap: {
    inundasi: {
      absolutePath: path.join(
        __dirname,
        "..",
        "protected_downloads",
        "cilacap",
        "raster-inundasi-tsunami-cilacap.zip",
      ),
      downloadName: "raster-inundasi-tsunami-cilacap.zip",
    },
    risiko: {
      absolutePath: path.join(
        __dirname,
        "..",
        "protected_downloads",
        "cilacap",
        "data-risiko-cilacap.zip",
      ),
      downloadName: "data-risiko-cilacap.zip",
    },
  },
  bakauheni: {
    inundasi: {
      absolutePath: path.join(
        __dirname,
        "..",
        "protected_downloads",
        "bakauheni",
        "raster-inundasi-tsunami-bakauheni.zip",
      ),
      downloadName: "raster-inundasi-tsunami-bakauheni.zip",
    },
    risiko: {
      absolutePath: path.join(
        __dirname,
        "..",
        "protected_downloads",
        "bakauheni",
        "data-risiko-bakauheni.zip",
      ),
      downloadName: "data-risiko-bakauheni.zip",
    },
  },
};

function normalizeValue(value = "") {
  return String(value).trim().toLowerCase();
}

exports.submitPayment = async (req, res) => {
  try {
    const {
      buyerName,
      buyerWhatsapp,
      buyerEmail,
      deliveryEmail,
      senderBank,
      buyerInstitution,
      buyerPurpose,
      buyerNotes,
      locationName,
      productNames,
      totalItems,
      adminFee,
      totalPayment,
      verificationType,
    } = req.body;

    if (
      !buyerName ||
      !buyerWhatsapp ||
      !buyerEmail ||
      !deliveryEmail ||
      !senderBank ||
      !locationName ||
      !productNames ||
      !totalPayment
    ) {
      return res.status(400).json({
        message: "Data payment belum lengkap.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Bukti pembayaran atau dokumen wajib diupload.",
      });
    }

    const uploadedFile = await uploadPaymentProof(req.file);

    const uploadedFileName = uploadedFile.key;
    const uploadedFilePath = uploadedFile.url;

    const [result] = await db.execute(
      `INSERT INTO payment_submissions
      (
        buyer_name,
        buyer_whatsapp,
        buyer_email,
        delivery_email,
        sender_bank,
        buyer_institution,
        buyer_purpose,
        buyer_notes,
        location_name,
        product_names,
        total_items,
        admin_fee,
        total_payment,
        verification_type,
        uploaded_file_name,
        uploaded_file_path,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        buyerName,
        buyerWhatsapp,
        buyerEmail,
        deliveryEmail,
        senderBank,
        buyerInstitution || null,
        buyerPurpose || null,
        buyerNotes || null,
        locationName,
        productNames,
        Number(totalItems || 0),
        Number(adminFee || 0),
        Number(totalPayment || 0),
        verificationType || "bukti-transfer",
        uploadedFileName,
        uploadedFilePath,
        "pending_verification",
      ],
    );

    try {
      await sendPaymentSubmissionEmail({
        submissionId: result.insertId,
        buyerName,
        buyerWhatsapp,
        buyerEmail,
        deliveryEmail,
        senderBank,
        buyerInstitution,
        buyerPurpose,
        buyerNotes,
        locationName,
        productNames,
        totalItems,
        adminFee,
        totalPayment,
        verificationType,
        uploadedFileName,
        uploadedFilePath,
      });
    } catch (emailError) {
      console.warn("Email gagal terkirim (non-fatal):", emailError.message);
      // Data sudah tersimpan di DB — lanjut return sukses
    }

    return res.status(201).json({
      message:
        "Bukti pembayaran berhasil dikirim. Tim INAMI akan memverifikasi.",
      submissionId: result.insertId,
    });
  } catch (error) {
    console.error("submitPayment error:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan server saat mengirim payment.",
    });
  }
};

exports.submitDirectRequest = async (req, res) => {
  try {
    const {
      buyerName,
      buyerWhatsapp,
      buyerEmail,
      deliveryEmail,
      senderBank,
      buyerInstitution,
      buyerPurpose,
      buyerNotes,
      locationName,
      productNames,
      totalItems,
      adminFee,
      totalPayment,
      verificationType,
      requesterRole,
      requesterWilayah,
    } = req.body;

    if (!buyerName || !buyerEmail || !locationName || !productNames) {
      return res.status(400).json({
        message: "Data request belum lengkap.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO payment_submissions
      (
        buyer_name,
        buyer_whatsapp,
        buyer_email,
        delivery_email,
        sender_bank,
        buyer_institution,
        buyer_purpose,
        buyer_notes,
        location_name,
        product_names,
        total_items,
        admin_fee,
        total_payment,
        verification_type,
        uploaded_file_name,
        uploaded_file_path,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        buyerName,
        buyerWhatsapp || null,
        buyerEmail,
        deliveryEmail || buyerEmail,
        senderBank || null,
        buyerInstitution || null,
        buyerPurpose || null,
        buyerNotes ||
          `Request otomatis oleh ${requesterRole || "user"}${requesterWilayah ? ` (${requesterWilayah})` : ""}`,
        locationName,
        productNames,
        Number(totalItems || 0),
        Number(adminFee || 0),
        Number(totalPayment || 0),
        verificationType || "admin-mitra-direct",
        null,
        null,
        "pending_verification",
      ],
    );

    try {
      await sendPaymentSubmissionEmail({
        submissionId: result.insertId,
        buyerName,
        buyerWhatsapp,
        buyerEmail,
        deliveryEmail: deliveryEmail || buyerEmail,
        senderBank: senderBank || "-",
        buyerInstitution,
        buyerPurpose,
        buyerNotes:
          buyerNotes ||
          `Request otomatis oleh ${requesterRole || "user"}${requesterWilayah ? ` (${requesterWilayah})` : ""}`,
        locationName,
        productNames,
        totalItems,
        adminFee: Number(adminFee || 0),
        totalPayment: Number(totalPayment || 0),
        verificationType: verificationType || "admin-mitra-direct",
        uploadedFileName: null,
        uploadedFilePath: null,
      });
    } catch (emailError) {
      console.warn(
        "Email direct request gagal terkirim (non-fatal):",
        emailError.message,
      );
    }

    return res.status(201).json({
      message: "Permintaan data berhasil dikirim ke developer.",
      submissionId: result.insertId,
    });
  } catch (error) {
    console.error("submitDirectRequest error:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan server saat mengirim request langsung.",
    });
  }
};

exports.downloadDataSecure = async (req, res) => {
  try {
    const { location, datasetType } = req.body;

    const role = normalizeValue(req.headers["x-user-role"] || "");
    const wilayah = normalizeValue(req.headers["x-user-wilayah"] || "");
    const requestedLocation = normalizeValue(location);
    const requestedDatasetType = normalizeValue(datasetType);

    if (!requestedLocation || !requestedDatasetType) {
      return res.status(400).json({
        message: "Location dan datasetType wajib dikirim.",
      });
    }

    if (!["cilacap", "bakauheni"].includes(requestedLocation)) {
      return res.status(400).json({
        message: "Location tidak valid.",
      });
    }

    if (!["inundasi", "risiko"].includes(requestedDatasetType)) {
      return res.status(400).json({
        message: "datasetType tidak valid.",
      });
    }

    if (!["admin", "mitra"].includes(role)) {
      return res.status(403).json({
        message: "Hanya admin dan mitra yang dapat mengunduh data langsung.",
      });
    }

    if (role === "mitra" && wilayah !== requestedLocation) {
      return res.status(403).json({
        message:
          "Akun mitra hanya boleh mengunduh data sesuai wilayah terdaftar.",
      });
    }

    const fileConfig =
      DATASET_FILE_MAP?.[requestedLocation]?.[requestedDatasetType];

    if (!fileConfig) {
      return res.status(404).json({
        message: "Konfigurasi file download tidak ditemukan.",
      });
    }

    if (!fs.existsSync(fileConfig.absolutePath)) {
      return res.status(404).json({
        message: "File dataset belum tersedia di server.",
      });
    }

    return res.download(
      fileConfig.absolutePath,
      fileConfig.downloadName,
      async (error) => {
        if (error) {
          console.error("downloadDataSecure download error:", error);

          if (!res.headersSent) {
            return res.status(500).json({
              message: "Gagal mengirim file download.",
            });
          }
        }

        const userIp =
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          req.ip ||
          "-";

        try {
          await db.execute(
            `
            INSERT INTO download_logs
            (
              user_name,
              user_email,
              role,
              wilayah,
              location_name,
              dataset_type,
              ip_address
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
              req.headers["x-user-name"] || "-",
              req.headers["x-user-email"] || "-",
              role,
              wilayah || null,
              requestedLocation,
              requestedDatasetType,
              userIp,
            ],
          );
        } catch (logError) {
          console.error("Download log gagal disimpan:", logError);
        }
      },
    );
  } catch (error) {
    console.error("downloadDataSecure error:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan server saat memproses download.",
    });
  }
};
