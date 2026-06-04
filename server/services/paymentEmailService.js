const resend = require("./resendMailer");

async function sendPaymentSubmissionEmail(payload) {
  const adminEmail = process.env.PAYMENT_ADMIN_EMAIL || process.env.MAIL_TO;

  await resend.emails.send({
    from: "INAMI Payment <onboarding@resend.dev>",
    to: adminEmail,
    subject: `💳 Payment Submission - ${payload.buyerName}`,

    html: `
      <h2>Payment Submission Baru</h2>

      <p><b>ID:</b> ${payload.submissionId}</p>
      <p><b>Nama:</b> ${payload.buyerName}</p>
      <p><b>WhatsApp:</b> ${payload.buyerWhatsapp}</p>
      <p><b>Email Pembeli:</b> ${payload.buyerEmail}</p>
      <p><b>Email Pengiriman:</b> ${payload.deliveryEmail}</p>

      <hr>

      <p><b>Lokasi:</b> ${payload.locationName}</p>
      <p><b>Produk:</b> ${payload.productNames}</p>

      <p><b>Total:</b>
      Rp${Number(payload.totalPayment || 0).toLocaleString("id-ID")}
      </p>

      <hr>

      <p>
        <b>Bukti Pembayaran:</b><br>
        <a href="${payload.uploadedFilePath}">
          Lihat File Upload
        </a>
      </p>
    `,
  });

  console.log("Payment email sent");
}

module.exports = {
  sendPaymentSubmissionEmail,
};
