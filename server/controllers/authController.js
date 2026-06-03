const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendCustomResetEmail(email, link) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #1e88e5; margin-bottom: 16px;">Reset Password INAMI</h2>
      <p style="color: #374151; line-height: 1.6;">
        Kami menerima permintaan untuk mereset password akun Anda.
      </p>

      <div style="margin: 24px 0;">
        <a href="${link}" 
           style="display: inline-block; padding: 12px 20px; background: #1e88e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
           Reset Password
        </a>
      </div>

      <p style="margin-top: 20px; font-size: 13px; color: #666; line-height: 1.6;">
        Jika bukan Anda yang meminta reset password, abaikan email ini.
      </p>

      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        INAMI Dashboard
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"INAMI Dashboard" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Password INAMI",
    html,
  });
}

exports.forgotPasswordFirebase = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/reset-password.html`,
      handleCodeInApp: false,
    };

    const link = await admin.auth().generatePasswordResetLink(
      normalizedEmail,
      actionCodeSettings
    );

    await sendCustomResetEmail(normalizedEmail, link);

    return res.status(200).json({
      message: "Jika email terdaftar, link reset sudah dikirim.",
    });
  } catch (err) {
    console.error("forgotPasswordFirebase error:", err);
    return res.status(500).json({
      message: "Gagal kirim reset password.",
    });
  }
};