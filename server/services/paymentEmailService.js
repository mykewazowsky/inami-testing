const resend = require("./resendMailer");

async function sendPaymentSubmissionEmail(payload) {
  console.log("=== PAYMENT EMAIL START ===");

  const adminEmail = process.env.PAYMENT_ADMIN_EMAIL || process.env.MAIL_TO;

  console.log("ADMIN EMAIL:", adminEmail);

  const result = await resend.emails.send({
    from: "INAMI Payment <onboarding@resend.dev>",
    to: adminEmail,
    subject: `💳 Payment Submission - ${payload.buyerName}`,
    html: `
      <h2>Payment Submission Baru</h2>
      <p>${payload.buyerName}</p>
    `,
  });

  console.log("RESEND RESULT:", result);

  return result;
}

module.exports = {
  sendPaymentSubmissionEmail,
};
