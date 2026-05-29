const fs = require('fs');
const path = require('path');

const sentEmailsDir = path.join(__dirname, '..', 'sent_emails');
if (!fs.existsSync(sentEmailsDir)) {
  fs.mkdirSync(sentEmailsDir, { recursive: true });
}

function sendInvoiceEmail(order, customerName, customerEmail, pdfInvoice) {
  return new Promise((resolve, reject) => {
    try {
      const emailId = `email_${order.id}.html`;
      const emailPath = path.join(sentEmailsDir, emailId);

      const memberDiscount = order.discountAmount - (order.voucherDiscount || 0);
      const voucherDiscount = order.voucherDiscount || 0;

      let discountRowsHtml = '';
      if (memberDiscount > 0) {
        discountRowsHtml += `
      <div class="invoice-row">
        <span>Rebat Ahli VIP Chempaka (15%):</span>
        <strong>-RM ${memberDiscount.toFixed(2)}</strong>
      </div>`;
      }
      if (voucherDiscount > 0) {
        discountRowsHtml += `
      <div class="invoice-row">
        <span>Rebat Baucar (${order.voucherCode || 'Baucar'}):</span>
        <strong>-RM ${voucherDiscount.toFixed(2)}</strong>
      </div>`;
      }

      // --- LUXURY HTML EMAIL TEMPLATE ---
      const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resit Pembelian Chempaka Jewels - #${order.id}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #F9F6F0;
      color: #303030;
      margin: 0;
      padding: 40px 20px;
    }
    .email-container {
      max-width: 600px;
      background-color: #FFFFFF;
      margin: 0 auto;
      border: 1px solid #E2E2E2;
      padding: 40px;
      box-shadow: 0 10px 25px rgba(48,48,48,0.05);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #C48B21;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: bold;
      color: #C48B21;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin: 0 0 5px 0;
    }
    .tagline {
      font-size: 10px;
      color: #777777;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    h1 {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      color: #303030;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #555555;
      margin-bottom: 20px;
    }
    .invoice-card {
      background-color: #F9F6F0;
      border: 1px solid #E2E2E2;
      padding: 20px;
      margin-bottom: 30px;
    }
    .invoice-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .invoice-row.bold {
      font-weight: bold;
      color: #303030;
      border-top: 1px dashed #C48B21;
      padding-top: 8px;
      margin-top: 8px;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background-color: #C48B21;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 12px 30px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-radius: 0px;
    }
    .btn:hover {
      background-color: #303030;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #777777;
      border-top: 1px solid #E2E2E2;
      padding-top: 20px;
      margin-top: 40px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">CHEMPAKA JEWELS</div>
      <div class="tagline">Keindahan Abadi. Warisan Temurun.</div>
    </div>
    
    <h1>Terima Kasih Atas Pembelian Anda, ${customerName}!</h1>
    
    <p>
      Kami dengan sukacitanya mengesahkan pembayaran anda bernilai <strong>RM ${order.total.toFixed(2)}</strong> bagi pesanan <strong>#${order.id}</strong> telah berjaya diterima melalui pintu gerbang pembayaran FPX Online Banking.
    </p>

    <p>
      Pakar pertukangan emas kami sedang menyediakan kepingan emas murni anda dengan ketelitian tertinggi bagi memastikan piawaian prestij Chempaka terpelihara. Penghantaran berkurier khas yang diinsuranskan sepenuhnya akan diuruskan dalam masa 2-3 hari bekerja.
    </p>

    <div class="invoice-card">
      <div class="invoice-row">
        <span>No. Transaksi:</span>
        <strong>${order.id}</strong>
      </div>
      <div class="invoice-row">
        <span>Tarikh Transaksi:</span>
        <strong>${new Date(order.createdAt).toLocaleDateString('ms-MY')}</strong>
      </div>
      <div class="invoice-row">
        <span>Subtotal Pesanan:</span>
        <strong>RM ${order.subtotal.toFixed(2)}</strong>
      </div>
      ${discountRowsHtml}
      <div class="invoice-row bold">
        <span>JUMLAH DIBAYAR:</span>
        <strong>RM ${order.total.toFixed(2)}</strong>
      </div>
    </div>

    <div class="btn-container">
      <a href="file:///${pdfInvoice.filePath.replace(/\\/g, '/')}" class="btn" target="_blank">
        Muat Turun Resit Rasmi (PDF)
      </a>
    </div>

    <p style="font-size: 12px; color: #777777; font-style: italic; text-align: center;">
      *Sila pastikan anda menyimpan resit PDF rasmi di atas bagi tujuan rujukan mutu dan jaminan buy-back 916/999.9 kami kelak.
    </p>

    <div class="footer">
      <strong>Butik Utama Chempaka Jewels</strong><br>
      Bukit Bintang, Kuala Lumpur, Malaysia<br>
      Sokongan Pelanggan VIP: +60 3 1234 5678 | hello@chempakajewels.my<br>
      <br>
      © 2026 Chempaka Jewels. Hak Cipta Terpelihara.
    </div>
  </div>
</body>
</html>
`;

      fs.writeFileSync(emailPath, emailHtml, 'utf8');

      console.log("\n========================================================");
      console.log("[EMAIL SIMULATOR] LUXURY EMAIL SENT SUCCESSFULLY!");
      console.log(`Recipient: ${customerEmail}`);
      console.log(`Subject: Resit Pembelian Chempaka Jewels - #${order.id}`);
      console.log(`Local HTML Email Preview Path:`);
      console.log(`file:///${emailPath.replace(/\\/g, '/')}`);
      console.log(`Linked PDF Invoice Path:`);
      console.log(`file:///${pdfInvoice.filePath.replace(/\\/g, '/')}`);
      console.log("========================================================\n");

      resolve({
        emailId,
        emailPath
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  sendInvoiceEmail
};
