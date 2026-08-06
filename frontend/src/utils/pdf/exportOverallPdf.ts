import { Alert } from 'react-native';
import { escapeHtml, formatCurr, formatNum, generateAndSharePdf } from './formatters';
import { formatDisplayDate } from '../dateUtils';

export async function exportOverallPdf({ dateFrom, dateTo, data }: { dateFrom?: string; dateTo?: string; data: any }) {
  if (!data) {
    Alert.alert('Empty Report', 'There is currently no report data to export as PDF.');
    return;
  }

  const showPeriod = Boolean(dateFrom && dateTo);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Overall Report</title>
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
          h2 { font-size: 12pt; font-weight: 800; margin: 0 0 10px 0; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>BROILER 360</h1>
            <div class="subtitle">Poultry Trading & Inventory Management</div>
          </div>
          <div class="meta">
            <div class="report-title">Overall Report</div>
            ${showPeriod ? `<div>Period: <strong>${escapeHtml(formatDisplayDate(dateFrom))}</strong> to <strong>${escapeHtml(formatDisplayDate(dateTo))}</strong></div>` : ''}
            <div>Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        <hr />

        <h2>Period Totals</h2>
        <table>
          <thead>
            <tr>
              <th>SECTION</th>
              <th class="right">SUMMARY</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>Purchases</strong></td><td class="right">${formatCurr(data?.purchases?.total_amount)} · qty ${formatNum(data?.purchases?.total_quantity)}</td></tr>
            <tr><td><strong>Sales</strong></td><td class="right">${formatCurr(data?.sales?.total_amount)} · qty ${formatNum(data?.sales?.total_quantity)}</td></tr>
            <tr><td><strong>Expenses</strong></td><td class="right">${formatCurr(data?.expenses?.total_amount)} (cash ${formatCurr(data?.expenses?.total_cash)} · UPI ${formatCurr(data?.expenses?.total_upi)})</td></tr>
          </tbody>
        </table>

      </body>
    </html>
  `;
  await generateAndSharePdf(html, 'Overall');
}
