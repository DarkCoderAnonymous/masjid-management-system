const PDFDocument = require('pdfkit');

const FILTER_LABELS = {
  monthly: 'Current Month',
  '3months': 'Last 3 Months',
  '6months': 'Last 6 Months',
  yearly: 'Current Year',
};

const PRIMARY_COLOR = '#166534'; // green-800
const ACCENT_COLOR = '#15803d'; // green-700
const LIGHT_GRAY = '#f3f4f6';
const BORDER_COLOR = '#d1d5db';

/**
 * Generates a donation statement PDF and pipes it to the response stream.
 * @param {import('http').ServerResponse} res
 * @param {object} user
 * @param {Array} donations
 * @param {number} totalAmount
 * @param {string} filter
 */
const generateDonationPDF = (res, user, donations, totalAmount, filter) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      doc.on('error', reject);
      doc.pipe(res);
      res.on('finish', resolve);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 100;

      // ─── Header Banner ───────────────────────────────────────────
      doc.rect(0, 0, pageWidth, 90).fill(PRIMARY_COLOR);
      doc.fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('🕌  Masjid Management System', 50, 22, { align: 'center' });
      doc.font('Helvetica')
        .fontSize(12)
        .text('Donation Statement', 50, 52, { align: 'center' });

      doc.fillColor('#000000').moveDown(3);

      // ─── Donor Info Box ──────────────────────────────────────────
      const infoY = 110;
      doc.rect(50, infoY, contentWidth, 80).fill(LIGHT_GRAY).stroke(BORDER_COLOR);

      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text('DONOR INFORMATION', 65, infoY + 10);
      doc.fillColor('#111827').font('Helvetica').fontSize(10);
      doc.text(`Name:`, 65, infoY + 28);
      doc.font('Helvetica-Bold').text(user.name, 110, infoY + 28);
      doc.font('Helvetica').text(`Mobile:`, 65, infoY + 44);
      doc.font('Helvetica-Bold').text(user.mobile || 'N/A', 110, infoY + 44);
      doc.font('Helvetica').text(`Period:`, 65, infoY + 60);
      doc.font('Helvetica-Bold').text(FILTER_LABELS[filter] || 'All Time', 110, infoY + 60);

      // Right column
      doc.font('Helvetica').text(`Generated:`, 350, infoY + 28);
      doc.font('Helvetica-Bold').text(
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        430, infoY + 28
      );
      doc.font('Helvetica').text(`Total Records:`, 350, infoY + 44);
      doc.font('Helvetica-Bold').text(String(donations.length), 430, infoY + 44);
      doc.font('Helvetica').text(`Total Amount:`, 350, infoY + 60);
      doc.font('Helvetica-Bold')
        .fillColor(ACCENT_COLOR)
        .text(`PKR ${totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`, 430, infoY + 60);

      doc.fillColor('#000000').font('Helvetica');

      // ─── Table ───────────────────────────────────────────────────
      const tableStartY = infoY + 100;
      const colWidths = [40, 120, 130, 250];
      const colX = [50, 90, 210, 340];
      const rowHeight = 24;

      // Table header
      doc.rect(50, tableStartY, contentWidth, rowHeight).fill(PRIMARY_COLOR);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
      const headers = ['#', 'Date', 'Amount (PKR)', 'Notes'];
      headers.forEach((h, i) => {
        doc.text(h, colX[i] + 4, tableStartY + 7, { width: colWidths[i] - 4 });
      });

      doc.fillColor('#111827').font('Helvetica').fontSize(9.5);
      let currentY = tableStartY + rowHeight;

      if (donations.length === 0) {
        doc.rect(50, currentY, contentWidth, rowHeight).fill('#fefce8').stroke(BORDER_COLOR);
        doc.fillColor('#6b7280')
          .fontSize(10)
          .text('No donation records found for the selected period.', 50, currentY + 7, {
            width: contentWidth,
            align: 'center',
          });
        currentY += rowHeight;
      } else {
        donations.forEach((donation, index) => {
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
          }

          const isEven = index % 2 === 0;
          doc.rect(50, currentY, contentWidth, rowHeight)
            .fill(isEven ? '#ffffff' : LIGHT_GRAY)
            .stroke(BORDER_COLOR);

          doc.fillColor('#111827');
          doc.text(String(index + 1), colX[0] + 4, currentY + 7, { width: colWidths[0] - 4 });
          doc.text(
            new Date(donation.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            colX[1] + 4, currentY + 7, { width: colWidths[1] - 4 }
          );
          doc.text(
            donation.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 }),
            colX[2] + 4, currentY + 7, { width: colWidths[2] - 4 }
          );
          doc.text(donation.notes || '—', colX[3] + 4, currentY + 7, {
            width: colWidths[3] - 8,
            lineBreak: false,
            ellipsis: true,
          });

          currentY += rowHeight;
        });
      }

      // ─── Footer Total ────────────────────────────────────────────
      currentY += 10;
      doc.rect(50, currentY, contentWidth, 36).fill(PRIMARY_COLOR);
      doc.fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(
          `TOTAL AMOUNT: PKR ${totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
          50, currentY + 10,
          { width: contentWidth, align: 'right', indent: -10 }
        );

      // ─── Document Footer ─────────────────────────────────────────
      currentY += 60;
      doc.fillColor('#9ca3af')
        .font('Helvetica')
        .fontSize(8)
        .text('This is a computer-generated document. No signature required.', 50, currentY, {
          width: contentWidth,
          align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateDonationPDF };
