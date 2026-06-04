const resend = require("./resendMailer");

async function sendPaymentSubmissionEmail(payload) {
  const adminEmail = process.env.PAYMENT_ADMIN_EMAIL || process.env.MAIL_TO;

  const totalPayment = Number(payload.totalPayment || 0).toLocaleString(
    "id-ID",
  );

  // =====================
  // EMAIL ADMIN
  // =====================

  const adminHtml = `
  <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
    <div style="max-width:700px;margin:auto;background:white;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);">

      <div style="background:#003049;padding:30px;text-align:center;">
        <h1 style="margin:0;color:white;">
          💳 PAYMENT SUBMISSION
        </h1>
      </div>

      <div style="padding:35px;">

        <div style="
          display:inline-block;
          background:#dbeafe;
          color:#1d4ed8;
          padding:8px 14px;
          border-radius:999px;
          font-size:12px;
          font-weight:bold;
          margin-bottom:20px;
        ">
          MENUNGGU VERIFIKASI
        </div>

        <h2 style="color:#003049;">
          Payment Submission Baru
        </h2>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px;font-weight:bold;">ID</td>
            <td>${payload.submissionId}</td>
          </tr>

          <tr>
            <td style="padding:10px;font-weight:bold;">Nama</td>
            <td>${payload.buyerName}</td>
          </tr>

          <tr>
            <td style="padding:10px;font-weight:bold;">WhatsApp</td>
            <td>${payload.buyerWhatsapp}</td>
          </tr>

          <tr>
            <td style="padding:10px;font-weight:bold;">Email Pembeli</td>
            <td>${payload.buyerEmail}</td>
          </tr>

          <tr>
            <td style="padding:10px;font-weight:bold;">Email Pengiriman</td>
            <td>${payload.deliveryEmail}</td>
          </tr>

          <tr>
            <td style="padding:10px;font-weight:bold;">Lokasi</td>
            <td>${payload.locationName}</td>
          </tr>

          <tr>
            <td style="padding:10px;font-weight:bold;">Produk</td>
            <td>${payload.productNames}</td>
          </tr>

          <tr>
            <td style="padding:10px;font-weight:bold;">Total</td>
            <td><strong>Rp${totalPayment}</strong></td>
          </tr>
        </table>

        <div style="
          margin-top:25px;
          padding:20px;
          background:#f8fafc;
          border-radius:12px;
          border:1px solid #e2e8f0;
        ">
          <strong>Bukti Pembayaran</strong>
          <br><br>

          <a href="${payload.uploadedFilePath}"
            style="
              display:inline-block;
              padding:12px 18px;
              background:#003049;
              color:white;
              text-decoration:none;
              border-radius:8px;
            ">
            Lihat File Upload
          </a>
        </div>

      </div>
    </div>
  </div>
  `;

  // =====================
  // EMAIL CUSTOMER
  // =====================

  const customerHtml = `
  <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">

    <div style="
      max-width:700px;
      margin:auto;
      background:white;
      border-radius:18px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,.08);
    ">

      <div style="
        background:#003049;
        padding:35px;
        text-align:center;
      ">

        <div style="
          width:80px;
          height:80px;
          background:#22c55e;
          border-radius:50%;
          margin:auto;
          line-height:80px;
          font-size:40px;
          color:white;
        ">
          ✓
        </div>

        <h1 style="
          color:white;
          margin-top:20px;
        ">
          Pembayaran Berhasil Diterima
        </h1>

      </div>

      <div style="padding:40px;">

        <p>Halo <strong>${payload.buyerName}</strong>,</p>

        <p>
          Bukti pembayaran Anda telah berhasil diterima oleh sistem INAMI.
        </p>

        <p>
          Tim kami akan melakukan verifikasi pembayaran sebelum data dikirimkan.
        </p>

        <div style="
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:12px;
          padding:24px;
          margin:24px 0;
        ">
          <p><strong>ID Transaksi</strong></p>
          <p>${payload.submissionId}</p>

          <p><strong>Lokasi</strong></p>
          <p>${payload.locationName}</p>

          <p><strong>Produk</strong></p>
          <p>${payload.productNames}</p>

          <p><strong>Total Pembayaran</strong></p>
          <p><strong>Rp${totalPayment}</strong></p>
        </div>

        <p>
          Setelah pembayaran diverifikasi, data akan dikirim ke email:
        </p>

        <p>
          <strong>${payload.deliveryEmail}</strong>
        </p>

        <hr style="margin:30px 0;">

        <p style="
          color:#64748b;
          font-size:13px;
        ">
          © ${new Date().getFullYear()} INAMI —
          Indonesia Tsunami Risk Monitoring for Coastal Infrastructure
        </p>

      </div>

    </div>

  </div>
  `;

  // EMAIL ADMIN

  await resend.emails.send({
    from: "INAMI Payment <onboarding@resend.dev>",
    to: adminEmail,
    subject: `💳 Payment Submission - ${payload.buyerName}`,
    html: adminHtml,
  });

  // EMAIL CUSTOMER

  try {
    console.log("CUSTOMER EMAIL:", payload.deliveryEmail);

    const customerResult = await resend.emails.send({
      from: "INAMI Payment <onboarding@resend.dev>",
      to: payload.deliveryEmail,
      subject: "✅ Bukti Pembayaran Berhasil Diterima",
      html: customerHtml,
    });

    console.log("CUSTOMER RESULT:", customerResult);
  } catch (err) {
    console.error("CUSTOMER EMAIL ERROR:", err);
  }

  console.log("Payment emails sent");
  console.log("ADMIN EMAIL:", adminEmail);
  console.log("CUSTOMER EMAIL:", payload.deliveryEmail);
}

module.exports = {
  sendPaymentSubmissionEmail,
};
