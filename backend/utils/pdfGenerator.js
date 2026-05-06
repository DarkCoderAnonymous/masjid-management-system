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

const EXPENSE_FILTER_LABELS = {
  '1month': 'This Month',
  '2months': 'Last 2 Months',
  '3months': 'Last 3 Months',
  '6months': 'Last 6 Months',
  'yearly': 'This Year',
};

const EXPENSE_COLOR = '#7c3aed'; // purple-700
const EXPENSE_ACCENT = '#6d28d9';

/**
 * Generates an expense report PDF and pipes it to the response stream.
 */
const generateExpensePDF = (res, expenses, totalAmount, filter) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      doc.on('error', reject);
      doc.pipe(res);
      res.on('finish', resolve);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 100;

      // ─── Header Banner ────────────────────────────────────────────
      doc.rect(0, 0, pageWidth, 90).fill(EXPENSE_COLOR);
      doc.fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('🕌  Masjid Management System', 50, 22, { align: 'center' });
      doc.font('Helvetica')
        .fontSize(12)
        .text('Expense Report', 50, 52, { align: 'center' });

      doc.fillColor('#000000').moveDown(3);

      // ─── Summary Box ─────────────────────────────────────────────
      const infoY = 110;
      doc.rect(50, infoY, contentWidth, 60).fill(LIGHT_GRAY).stroke(BORDER_COLOR);

      doc.fillColor(EXPENSE_COLOR).font('Helvetica-Bold').fontSize(11).text('REPORT SUMMARY', 65, infoY + 10);
      doc.fillColor('#111827').font('Helvetica').fontSize(10);
      doc.text('Period:', 65, infoY + 28);
      doc.font('Helvetica-Bold').text(EXPENSE_FILTER_LABELS[filter] || 'All Time', 120, infoY + 28);

      doc.font('Helvetica').text('Generated:', 320, infoY + 28);
      doc.font('Helvetica-Bold').text(
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        395, infoY + 28
      );
      doc.font('Helvetica').text('Total Records:', 320, infoY + 44);
      doc.font('Helvetica-Bold').text(String(expenses.length), 395, infoY + 44);

      doc.fillColor('#000000').font('Helvetica');

      // ─── Table ────────────────────────────────────────────────────
      const tableStartY = infoY + 80;
      // #, Name, Amount, Date, Description, Recorded By
      const colWidths = [30, 130, 90, 80, 170, 95];
      const colX    = [50, 80, 210, 300, 380, 455];  // approx, content width ~495
      // Recalculate to fit A4 (495 usable)
      // #=30, Name=130, Amount=85, Date=80, Desc=130, RecBy=90 => 30+130+85+80+130+90=545 too wide
      // Let's simplify: #=28, Name=120, Amt=80, Date=80, Desc=130, RecBy=87 => 525 still too wide
      // Actually contentWidth = 595-100=495
      // #=28, Name=110, Amt=80, Date=80, Desc=120, RecBy=77 => 495 ✓
      const cw = [28, 110, 80, 80, 120, 77];
      const cx = [50];
      for (let i = 1; i < cw.length; i++) cx.push(cx[i - 1] + cw[i - 1]);

      const rowHeight = 24;

      // Header row
      doc.rect(50, tableStartY, contentWidth, rowHeight).fill(EXPENSE_COLOR);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(9.5);
      const headers = ['#', 'Expense Name', 'Amount (PKR)', 'Date', 'Description', 'Recorded By'];
      headers.forEach((h, i) => {
        doc.text(h, cx[i] + 3, tableStartY + 7, { width: cw[i] - 3, lineBreak: false });
      });

      doc.fillColor('#111827').font('Helvetica').fontSize(9);
      let currentY = tableStartY + rowHeight;

      if (expenses.length === 0) {
        doc.rect(50, currentY, contentWidth, rowHeight).fill('#fefce8').stroke(BORDER_COLOR);
        doc.fillColor('#6b7280')
          .fontSize(10)
          .text('No expense records found for the selected period.', 50, currentY + 7, {
            width: contentWidth,
            align: 'center',
          });
        currentY += rowHeight;
      } else {
        expenses.forEach((expense, index) => {
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
          }

          const isEven = index % 2 === 0;
          doc.rect(50, currentY, contentWidth, rowHeight)
            .fill(isEven ? '#ffffff' : LIGHT_GRAY)
            .stroke(BORDER_COLOR);

          doc.fillColor('#111827');
          doc.text(String(index + 1), cx[0] + 3, currentY + 7, { width: cw[0] - 3 });
          doc.text(expense.name, cx[1] + 3, currentY + 7, { width: cw[1] - 3, lineBreak: false, ellipsis: true });
          doc.fillColor(EXPENSE_ACCENT).font('Helvetica-Bold')
            .text(expense.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 }), cx[2] + 3, currentY + 7, { width: cw[2] - 3 });
          doc.fillColor('#111827').font('Helvetica')
            .text(
              new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              cx[3] + 3, currentY + 7, { width: cw[3] - 3 }
            );
          doc.text(expense.description || '—', cx[4] + 3, currentY + 7, { width: cw[4] - 3, lineBreak: false, ellipsis: true });
          doc.text(expense.recordedBy?.name || '—', cx[5] + 3, currentY + 7, { width: cw[5] - 3, lineBreak: false, ellipsis: true });

          currentY += rowHeight;
        });
      }

      // ─── Footer Total ─────────────────────────────────────────────
      currentY += 10;
      doc.rect(50, currentY, contentWidth, 36).fill(EXPENSE_COLOR);
      doc.fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(
          `TOTAL EXPENSES: PKR ${totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
          50, currentY + 10,
          { width: contentWidth, align: 'right', indent: -10 }
        );

      // ─── Document Footer ──────────────────────────────────────────
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

module.exports = { generateDonationPDF, generateExpensePDF };
