import { Alert } from 'react-native';
import { escapeHtml, formatCurr, generateAndSharePdf } from './formatters';
import { formatDisplayDate } from '../dateUtils';

export async function exportExpensesPdf({ dateFrom, dateTo, groupBy, data }: { dateFrom?: string; dateTo?: string; groupBy?: string; data: any }) {
  const rows = data?.rows || [];
  if (rows.length === 0) {
    Alert.alert('Empty Report', 'There is currently no report data to export as PDF.');
    return;
  }

  const showPeriod = Boolean(dateFrom && dateTo);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Expenses Report</title>
        <style>
          @page { margin: 15mm; size: A4; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, sans-serif; color: #000; background: #fff; margin: 0; padding: 10px; font-size: 10pt; line-height: 1.35; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
          h1 { font-size: 22pt; font-weight: 900; margin: 0; letter-spacing: -0.5px; text-transform: uppercase; }
          .subtitle { font-size: 8.5pt; font-weight: 600; letter-spacing: 1px; color: #444; text-transform: uppercase; margin-top: 3px; }
          .meta { text-align: right; font-size: 9pt; color: #111; }
          .report-title { font-size: 14pt; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase; }
          hr { border: 0; border-top: 2px solid #000; margin: 12px 0 16px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
          th { border-bottom: 2px solid #000; padding: 8px 6px; font-size: 9pt; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
          th.right, td.right { text-align: right; }
          td { border-bottom: 1px solid #d0d0d0; padding: 8px 6px; font-size: 10pt; }
          tbody tr:nth-child(even) { background-color: #f7f7f7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .tfoot { font-weight: 900; border-top: 2px solid #000; border-bottom: 3px double #000; }
          .tfoot td { border-bottom: none !important; padding: 10px 6px; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>BROILER 360</h1>
            <div class="subtitle">Poultry Trading & Inventory Management</div>
          </div>
          <div class="meta">
            <div class="report-title">Expenses Report</div>
            ${showPeriod ? `<div>Period: <strong>${escapeHtml(formatDisplayDate(dateFrom))}</strong> to <strong>${escapeHtml(formatDisplayDate(dateTo))}</strong></div>` : ''}
            <div>Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        <hr />

        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>CATEGORY</th>
              <th class="right">CASH (₹)</th>
              <th class="right">UPI (₹)</th>
              <th class="right">TOTAL (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row: any) => `
              <tr>
                <td><strong>${escapeHtml(formatDisplayDate(row.date))}</strong></td>
                <td>${escapeHtml(row.category_name || '-')}</td>
                <td class="right">${formatCurr(row.cash_amount)}</td>
                <td class="right">${formatCurr(row.upi_amount)}</td>
                <td class="right">${formatCurr(row.total_amount)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="tfoot">
              <td colspan="2">TOTAL EXPENSES</td>
              <td class="right">${formatCurr(data?.total_cash)}</td>
              <td class="right">${formatCurr(data?.total_upi)}</td>
              <td class="right">${formatCurr(data?.total_amount)}</td>
            </tr>
          </tfoot>
        </table>

      </body>
    </html>
  `;
  await generateAndSharePdf(html, 'Expenses');
}
