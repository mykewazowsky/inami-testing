const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.subscribe = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Format email tidak valid." });
  }

  try {
    await transporter.sendMail({
      from: `"INAMI Dashboard" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO,
      subject: "📩 Permintaan Bermitra Baru — INAMI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background: #003049; padding: 24px; text-align: center;">
            <h2 style="color: white; margin: 0;">INAMI Dashboard</h2>
            <p style="color: #d0f0ec; margin: 4px 0 0;">Permintaan Bermitra Baru</p>
          </div>
          <div style="padding: 28px;">
            <p style="font-size: 15px; color: #333;">Ada calon mitra baru yang ingin bergabung:</p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 16px;">
              📧 <strong>${email}</strong>
            </div>
            <p style="font-size: 13px; color: #888;">Dikirim otomatis dari form kontak INAMI Dashboard.</p>
          </div>
        </div>
      `,
    });

    console.log("Email partnership sent:", info.messageId);

    return res
      .status(200)
      .json({ message: "Terima kasih! Kami akan segera menghubungi Anda." });
  } catch (error) {
    console.error("Subscribe email error:", error);
    return res
      .status(500)
      .json({ message: "Gagal mengirim notifikasi. Coba lagi nanti." });
  }
};
