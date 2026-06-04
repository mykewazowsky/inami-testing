const resend = require("../services/resendMailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
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
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.MAIL_TO,
      subject: "INAMI Partnership Request",
      html: `
    <h2>Partnership Request</h2>
    <p>Email: ${email}</p>
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
