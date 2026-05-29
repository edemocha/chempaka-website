const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../database');

const invoiceDir = path.join(__dirname, '..', 'invoices');
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir, { recursive: true });
}

function generateInvoicePdf(order, customerName, customerEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const invoiceFileName = `invoice_${order.id}.pdf`;
      const invoicePath = path.join(invoiceDir, invoiceFileName);
      const writeStream = fs.createWriteStream(invoicePath);

      doc.pipe(writeStream);

      // --- BRANDING & HEADER ---
      doc.fillColor('#303030')
         .font('Helvetica-Bold')
         .fontSize(24)
         .text('CHEMPAKA JEWELS', 50, 45, { tracking: 2 });

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#777777')
         .text('Keindahan Abadi. Warisan Temurun.', 50, 75);

      // Corporate Contact
      doc.textAlign = 'right';
      doc.fontSize(8)
         .fillColor('#303030')
         .text('Butik Chempaka Utama, Bukit Bintang', 350, 45)
         .text('Kuala Lumpur, Malaysia', 350, 57)
         .text('Sokongan: hello@chempakajewels.my', 350, 69);
      doc.textAlign = 'left';

      // Gold Accent Divider Line
      doc.strokeColor('#C48B21')
         .lineWidth(2)
         .moveTo(50, 95)
         .lineTo(550, 95)
         .stroke();

      // --- INVOICE & CUSTOMER INFO ---
      doc.fillColor('#303030')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('RESIT RASMI / OFFICIAL INVOICE', 50, 115);

      doc.fontSize(9)
         .font('Helvetica')
         .text(`No. Resit / Invoice No : ${order.id}`, 50, 135)
         .text(`Tarikh / Date          : ${new Date(order.createdAt).toLocaleDateString('ms-MY')}`, 50, 147)
         .text(`Bayaran / Payment      : FPX Online Banking (SUCCESS)`, 50, 159);

      // Customer Details
      const user = db.findUserByEmail(customerEmail);
      const isMember = user && user.role === 'member';
      const keahlianText = isMember ? 'Ahli VIP / VIP Member (15% Discount)' : 'Pelanggan Biasa / Guest Customer';

      doc.font('Helvetica-Bold')
         .text('DIPESAN OLEH / BILL TO:', 320, 115);
      doc.font('Helvetica')
         .text(`Nama / Name   : ${customerName}`, 320, 135)
         .text(`Emel / Email  : ${customerEmail}`, 320, 147)
         .text(`Keahlian      : ${keahlianText}`, 320, 159);

      // Elegant Thin Divider Line
      doc.strokeColor('#E2E2E2')
         .lineWidth(1)
         .moveTo(50, 185)
         .lineTo(550, 185)
         .stroke();

      // --- ITEMS TABLE HEADER ---
      let y = 205;
      doc.fillColor('#303030')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('ITEM / DESCRIPTION', 50, y)
         .text('PURITY', 240, y)
         .text('WEIGHT', 300, y)
         .text('QTY', 360, y)
         .text('PRICE (RM)', 400, y)
         .text('TOTAL (RM)', 480, y);

      doc.strokeColor('#303030')
         .lineWidth(0.5)
         .moveTo(50, y + 15)
         .lineTo(550, y + 15)
         .stroke();

      // --- ITEMS TABLE ROWS ---
      y = 235;
      doc.font('Helvetica').fontSize(9);

      order.items.forEach(item => {
        doc.text(item.title, 50, y, { width: 180, lineGap: 2 });
        doc.text(item.purity, 240, y);
        doc.text(`${item.weight.toFixed(2)}g`, 300, y);
        doc.text(item.quantity.toString(), 360, y);
        doc.text(item.price.toFixed(2), 400, y);
        doc.text((item.price * item.quantity).toFixed(2), 480, y);
        
        y += 25;
      });

      // --- TOTALS BLOCK ---
      doc.strokeColor('#E2E2E2')
         .lineWidth(0.5)
         .moveTo(50, y + 10)
         .lineTo(550, y + 10)
         .stroke();

      y += 25;
      doc.font('Helvetica-Bold').text('RINGKASAN CAJ / CHARGES SUMMARY:', 50, y);
      
      doc.font('Helvetica')
         .text('Jumlah Asal / Gross Subtotal:', 300, y)
         .text(`RM ${order.subtotal.toFixed(2)}`, 480, y);

      const memberDiscount = order.discountAmount - (order.voucherDiscount || 0);
      const voucherDiscount = order.voucherDiscount || 0;

      if (memberDiscount > 0) {
        y += 18;
        doc.text('Rebat Keahlian / Member Discount (15%):', 300, y)
           .text(`-RM ${memberDiscount.toFixed(2)}`, 480, y);
      }

      if (voucherDiscount > 0) {
        y += 18;
        doc.text(`Rebat Baucar / Voucher (${order.voucherCode || 'Voucher'}):`, 300, y)
           .text(`-RM ${voucherDiscount.toFixed(2)}`, 480, y);
      }

      y += 18;
      doc.text('Caj Penghantaran / Insured Shipping:', 300, y)
         .text('PERCUMA / FREE', 480, y);

      y += 22;
      doc.strokeColor('#C48B21')
         .lineWidth(1)
         .moveTo(300, y - 5)
         .lineTo(550, y - 5)
         .stroke();

      doc.fillColor('#C48B21')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('JUMLAH DIBAYAR / TOTAL PAID:', 300, y)
         .text(`RM ${order.total.toFixed(2)}`, 480, y);

      // --- SIGNATURES & CORPORATE FOOTER ---
      y = doc.page.height - 120;
      
      doc.strokeColor('#E2E2E2')
         .lineWidth(0.5)
         .moveTo(50, y)
         .lineTo(550, y)
         .stroke();

      y += 20;
      doc.fillColor('#777777')
         .font('Helvetica-Oblique')
         .fontSize(8)
         .text('Resit rasmi ini dihasilkan secara automatik melalui sistem e-dagang Chempaka Jewels.', 50, y)
         .text('Emas 916/999.9 kami didatangkan bersama Sijil Ketulenan Rasmi & Geranti Pembelian Semula.', 50, y + 12);

      doc.font('Helvetica-Bold')
         .fillColor('#303030')
         .text('Siri Platinum - Nilai Abadi. Keanggunan Terukir.', 50, y + 30);

      doc.end();

      writeStream.on('finish', () => {
        console.log(`PDF successfully generated at ${invoicePath}`);
        resolve({
          fileName: invoiceFileName,
          filePath: invoicePath
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  generateInvoicePdf
};
