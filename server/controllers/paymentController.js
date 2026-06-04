const { uploadPaymentProof } = require("../services/r2");
const db = require("../firebase");
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

    const docRef = await db.collection("payment_submissions").add({
      buyer_name: buyerName,
      buyer_whatsapp: buyerWhatsapp,
      buyer_email: buyerEmail,
      delivery_email: deliveryEmail,
      sender_bank: senderBank,

      buyer_institution: buyerInstitution || "",
      buyer_purpose: buyerPurpose || "",
      buyer_notes: buyerNotes || "",

      location_name: locationName,
      product_names: productNames,

      total_items: Number(totalItems || 0),
      admin_fee: Number(adminFee || 0),
      total_payment: Number(totalPayment || 0),

      verification_type: verificationType || "bukti-transfer",

      uploaded_file_name: uploadedFileName,
      uploaded_file_path: uploadedFilePath,

      status: "pending_verification",

      created_at: new Date(),
    });

    try {
      await sendPaymentSubmissionEmail({
        submissionId: docRef.id,
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
      submissionId: docRef.id,
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

    const docRef = await db.collection("payment_submissions").add({
      buyer_name: buyerName,
      buyer_whatsapp: buyerWhatsapp,
      buyer_email: buyerEmail,
      delivery_email: deliveryEmail,
      sender_bank: senderBank,

      buyer_institution: buyerInstitution || "",
      buyer_purpose: buyerPurpose || "",
      buyer_notes: buyerNotes || "",

      location_name: locationName,
      product_names: productNames,

      total_items: Number(totalItems || 0),
      admin_fee: Number(adminFee || 0),
      total_payment: Number(totalPayment || 0),

      verification_type: verificationType || "bukti-transfer",

      uploaded_file_name: uploadedFileName,
      uploaded_file_path: uploadedFilePath,

      status: "pending_verification",

      created_at: new Date(),
    });

    try {
      await sendPaymentSubmissionEmail({
        submissionId: docRef.id,
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
      submissionId: docRef.id,
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
          await db.collection("download_logs").add({
            user_name: req.headers["x-user-name"] || "-",
            user_email: req.headers["x-user-email"] || "-",

            role,
            wilayah,

            location_name: requestedLocation,
            dataset_type: requestedDatasetType,

            ip_address: userIp,

            created_at: new Date(),
          });
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
