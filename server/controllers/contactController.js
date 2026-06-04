const resend = require("../services/resendMailer");

exports.subscribe = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      message: "Format email tidak valid.",
    });
  }

  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.MAIL_TO,
      subject: "INAMI Partnership Request",
      html: `
        <h2>Partnership Request</h2>
        <p>Email: ${email}</p>
      `,
    });

    console.log("Email partnership sent:", result);

    return res.status(200).json({
      message: "Terima kasih! Kami akan segera menghubungi Anda.",
    });
  } catch (error) {
    console.error("Subscribe email error:", error);

    return res.status(500).json({
      message: "Gagal mengirim notifikasi. Coba lagi nanti.",
    });
  }
};
