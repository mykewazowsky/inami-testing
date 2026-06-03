const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendResetPasswordEmail(to, resetLink) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Reset Password INAMI</h2>
      <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
      <p>Klik tombol di bawah ini untuk membuat password baru:</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
      </p>
      <p>Atau buka link ini secara manual:</p>
      <p>${resetLink}</p>
      <p>Link ini berlaku selama 1 jam.</p>
      <p>Jika Anda tidak merasa meminta reset password, abaikan email ini.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: "Reset Password INAMI Dashboard",
    html,
  });

  console.log("Reset password email sent:", info.messageId);
  return info;
}

async function sendPaymentSubmissionEmail(payload) {
  const adminEmail = process.env.PAYMENT_ADMIN_EMAIL || process.env.MAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Payment Submission Baru</h2>
      <p><strong>ID:</strong> ${payload.submissionId}</p>
      <p><strong>Nama:</strong> ${payload.buyerName}</p>
      <p><strong>WhatsApp:</strong> ${payload.buyerWhatsapp}</p>
      <p><strong>Email Pembeli:</strong> ${payload.buyerEmail}</p>
      <p><strong>Email Pengiriman:</strong> ${payload.deliveryEmail}</p>
      <p><strong>Bank Pengirim:</strong> ${payload.senderBank}</p>
      <p><strong>Instansi:</strong> ${payload.buyerInstitution || "-"}</p>
      <p><strong>Tujuan:</strong> ${payload.buyerPurpose || "-"}</p>
      <p><strong>Catatan:</strong> ${payload.buyerNotes || "-"}</p>
      <p><strong>Lokasi:</strong> ${payload.locationName}</p>
      <p><strong>Produk:</strong> ${payload.productNames}</p>
      <p><strong>Jumlah Item:</strong> ${payload.totalItems}</p>
      <p><strong>Biaya Admin:</strong> Rp${Number(payload.adminFee || 0).toLocaleString("id-ID")}</p>
      <p><strong>Total Pembayaran:</strong> Rp${Number(payload.totalPayment || 0).toLocaleString("id-ID")}</p>
      <p><strong>Tipe Verifikasi:</strong> ${payload.verificationType}</p>
      <p><strong>File Upload:</strong> ${payload.uploadedFileName}</p>
      <p><strong>Lokasi File:</strong> ${payload.uploadedFilePath}</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: adminEmail,
    subject: `Payment Submission #${payload.submissionId} - ${payload.buyerName}`,
    html,
  });

  console.log("Payment email sent:", info.messageId);
  return info;
}

module.exports = {
  sendResetPasswordEmail,
  sendPaymentSubmissionEmail,
};
