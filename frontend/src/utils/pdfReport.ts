import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export type ReportTab = 'Overall' | 'Purchases' | 'Sales' | 'Inventory' | 'Expenses' | 'Outstanding';

export interface ExportReportOptions {
  activeTab: ReportTab;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: string;
  data: any;
}

function formatCurr(num?: number | string): string {
  if (num == null) return '₹0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '₹0';
  return `₹${Number(n.toFixed(2)).toLocaleString('en-IN')}`;
}

function formatNum(num?: number | string): string {
  if (num == null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '0';
  return Number(n.toFixed(2)).toLocaleString('en-IN');
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type SectionHtml = { title: string; tableHeader: string; tableBody: string; tableFooter: string };

function purchasesOrSalesSection(title: string, data: any, groupBy?: string): SectionHtml {
  const rows = data?.rows || [];
  return {
    title,
    tableHeader: `
      <tr>
        <th>${escapeHtml(groupBy ? groupBy.toUpperCase() : 'DATE / PARTY / ITEM')}</th>
        <th class="right">QUANTITY</th>
        <th class="right">BILLS COUNT</th>
        <th class="right">AMOUNT (₹)</th>
      </tr>
    `,
    tableBody: rows
      .map(
        (row: any) => `
        <tr>
          <td><strong>${escapeHtml(row.label || row.key || '-')}</strong></td>
          <td class="right">${formatNum(row.quantity)}</td>
          <td class="right">${formatNum(row.count)}</td>
          <td class="right font-semibold">${formatCurr(row.amount)}</td>
        </tr>
      `
      )
      .join(''),
    tableFooter: `
      <tr class="tfoot">
        <td>TOTAL SUMMARIZED</td>
        <td class="right">${formatNum(data?.total_quantity)}</td>
        <td class="right">-</td>
        <td class="right">${formatCurr(data?.total_amount)}</td>
      </tr>
    `,
  };
}

function expensesSection(data: any, groupBy?: string): SectionHtml {
  const rows = data?.rows || [];
  return {
    title: 'Expenses',
    tableHeader: `
      <tr>
        <th>${groupBy === 'category' ? 'EXPENSE CATEGORY' : 'DATE'}</th>
        <th class="right">CASH (₹)</th>
        <th class="right">UPI (₹)</th>
        <th class="right">TOTAL (₹)</th>
      </tr>
    `,
    tableBody: rows
      .map(
        (row: any) => `
        <tr>
          <td><strong>${escapeHtml(row.label || row.key || '-')}</strong></td>
          <td class="right">${formatCurr(row.cash_amount)}</td>
          <td class="right">${formatCurr(row.upi_amount)}</td>
          <td class="right">${formatCurr(row.total_amount)}</td>
        </tr>
      `
      )
      .join(''),
    tableFooter: `
      <tr class="tfoot">
        <td>TOTAL EXPENSES</td>
        <td class="right">${formatCurr(data?.total_cash)}</td>
        <td class="right">${formatCurr(data?.total_upi)}</td>
        <td class="right">${formatCurr(data?.total_amount)}</td>
      </tr>
    `,
  };
}

function inventorySection(rows: any[]): SectionHtml {
  return {
    title: 'Inventory',
    tableHeader: `
      <tr>
        <th>ITEM NAME (EN / TA)</th>
        <th class="center">UNIT</th>
        <th class="right">AVAILABLE</th>
        <th class="right">USED</th>
        <th class="right">PURCHASED</th>
        <th class="right">SOLD</th>
        <th class="right">REMAINING</th>
      </tr>
    `,
    tableBody: rows
      .map(
        (row: any) => `
        <tr>
          <td><strong>${escapeHtml(row.name_en || '')} (${escapeHtml(row.name_ta || '')})</strong></td>
          <td class="center">${escapeHtml(row.unit_type || '')}</td>
          <td class="right">${formatNum(row.available_stock)}</td>
          <td class="right">${formatNum(row.used_stock)}</td>
          <td class="right">${formatNum(row.purchased_quantity)}</td>
          <td class="right">${formatNum(row.sold_quantity)}</td>
          <td class="right"><strong>${formatNum(row.remaining_stock ?? row.available_stock)}</strong></td>
        </tr>
      `
      )
      .join(''),
    tableFooter: '',
  };
}

function outstandingSection(rows: any[]): SectionHtml {
  let totalPending = 0;
  const tableBody = rows
    .map((row: any) => {
      const pending = parseFloat(row.pending_amount || '0');
      totalPending += Number.isNaN(pending) ? 0 : pending;
      return `
        <tr>
          <td>
            <strong>${escapeHtml(row.name || '')}</strong>
            <div class="text-xs text-muted">${escapeHtml(row.company_name || '')} · ${escapeHtml(row.mobile || '')}</div>
          </td>
          <td class="center">${row.party_type === 'SUPPLIER' ? 'Purchaser' : 'Customer'}</td>
          <td class="right">${formatCurr(row.opening_balance)}</td>
          <td class="right">${formatCurr(row.bills_or_purchases)}</td>
          <td class="right">${formatCurr(row.payments)}</td>
          <td class="right"><strong>${formatCurr(row.pending_amount)}</strong></td>
        </tr>
      `;
    })
    .join('');

  return {
    title: 'Outstanding',
    tableHeader: `
      <tr>
        <th>PARTY NAME & DETAILS</th>
        <th class="center">TYPE</th>
        <th class="right">OPENING (₹)</th>
        <th class="right">BILLS / PURCHASES (₹)</th>
        <th class="right">PAYMENTS (₹)</th>
        <th class="right">PENDING BALANCE (₹)</th>
      </tr>
    `,
    tableBody,
    tableFooter: `
      <tr class="tfoot">
        <td colspan="5">TOTAL OUTSTANDING PENDING</td>
        <td class="right">${formatCurr(totalPending)}</td>
      </tr>
    `,
  };
}

function buildSections(activeTab: ReportTab, data: any, groupBy?: string): SectionHtml[] {
  if (activeTab === 'Overall') {
    return [
      purchasesOrSalesSection('Purchases', data?.purchases, 'date'),
      purchasesOrSalesSection('Sales', data?.sales, 'date'),
      expensesSection(data?.expenses, 'date'),
      inventorySection(Array.isArray(data?.inventory) ? data.inventory : []),
      outstandingSection(Array.isArray(data?.outstanding) ? data.outstanding : []),
    ];
  }
  if (activeTab === 'Purchases' || activeTab === 'Sales') {
    return [purchasesOrSalesSection(activeTab, data, groupBy)];
  }
  if (activeTab === 'Expenses') return [expensesSection(data, groupBy)];
  if (activeTab === 'Inventory') return [inventorySection(Array.isArray(data) ? data : [])];
  if (activeTab === 'Outstanding') return [outstandingSection(Array.isArray(data) ? data : [])];
  return [];
}

function sectionHasRows(section: SectionHtml): boolean {
  return Boolean(section.tableBody && section.tableBody.trim());
}

function overallSummaryHtml(data: any): string {
  const pending = (Array.isArray(data?.outstanding) ? data.outstanding : []).reduce(
    (sum: number, row: any) => sum + (parseFloat(row.pending_amount || '0') || 0),
    0
  );
  const inventoryCount = Array.isArray(data?.inventory) ? data.inventory.length : 0;
  return `
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
        <tr><td><strong>Outstanding</strong></td><td class="right">${formatCurr(pending)}</td></tr>
        <tr><td><strong>Inventory</strong></td><td class="right">${inventoryCount} items</td></tr>
      </tbody>
    </table>
  `;
}

function renderSection(section: SectionHtml, index: number): string {
  const emptyNote = !sectionHasRows(section)
    ? `<p class="empty">No data in this section.</p>`
    : '';
  return `
    <section class="report-section ${index > 0 ? 'break-break' : ''}">
      <h2>${escapeHtml(section.title)}</h2>
      ${emptyNote}
      ${
        sectionHasRows(section)
          ? `<table>
              <thead>${section.tableHeader}</thead>
              <tbody>${section.tableBody}</tbody>
              ${section.tableFooter ? `<tfoot>${section.tableFooter}</tfoot>` : ''}
            </table>`
          : ''
      }
    </section>
  `;
}

export async function exportReportToPdf({
  activeTab,
  dateFrom,
  dateTo,
  groupBy,
  data,
}: ExportReportOptions): Promise<void> {
  const sections = buildSections(activeTab, data, groupBy);
  const hasAnyRows =
    activeTab === 'Overall'
      ? sections.some(sectionHasRows) || Boolean(data)
      : sections.some(sectionHasRows);

  if (!data || !hasAnyRows) {
    Alert.alert('Empty Report', 'There is currently no report data to export as PDF.');
    return;
  }

  const showPeriod = Boolean(dateFrom && dateTo && activeTab !== 'Inventory' && activeTab !== 'Outstanding');
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(activeTab)} Report</title>
        <style>
          @page { margin: 15mm; size: A4; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 10px;
            font-size: 10pt;
            line-height: 1.35;
          }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
          h1 { font-size: 22pt; font-weight: 900; margin: 0; letter-spacing: -0.5px; text-transform: uppercase; }
          h2 { font-size: 12pt; font-weight: 800; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.4px; }
          .subtitle { font-size: 8.5pt; font-weight: 600; letter-spacing: 1px; color: #444; text-transform: uppercase; margin-top: 3px; }
          .meta { text-align: right; font-size: 9pt; color: #111; }
          .report-title { font-size: 14pt; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase; }
          hr { border: 0; border-top: 2px solid #000; margin: 12px 0 16px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th { border-bottom: 2px solid #000; padding: 8px 6px; font-size: 9pt; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
          th.right, td.right { text-align: right; }
          th.center, td.center { text-align: center; }
          td { border-bottom: 1px solid #d0d0d0; padding: 8px 6px; font-size: 10pt; }
          tbody tr:nth-child(even) { background-color: #f7f7f7; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .text-xs { font-size: 8pt; }
          .text-muted { color: #555; margin-top: 2px; }
          .tfoot { font-weight: 900; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: #fff !important; }
          .tfoot td { border-bottom: none !important; padding: 10px 6px; font-size: 11pt; }
          .footer { margin-top: 28px; font-size: 8pt; color: #444; border-top: 1px solid #ccc; padding-top: 8px; display: flex; justify-content: space-between; }
          .report-section { margin-bottom: 22px; }
          .page-break { page-break-before: always; }
          .empty { color: #555; font-size: 9pt; margin: 0 0 12px 0; }
          .summary-block { margin-bottom: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>BROILER 360</h1>
            <div class="subtitle">Poultry Trading & Inventory Management</div>
          </div>
          <div class="meta">
            <div class="report-title">${escapeHtml(activeTab)} Report</div>
            ${showPeriod ? `<div>Period: <strong>${escapeHtml(dateFrom)}</strong> to <strong>${escapeHtml(dateTo)}</strong></div>` : ''}
            ${groupBy && activeTab !== 'Overall' && activeTab !== 'Inventory' && activeTab !== 'Outstanding' ? `<div>Grouped By: <strong style="text-transform: capitalize;">${escapeHtml(groupBy)}</strong></div>` : ''}
            <div>Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        <hr />

        ${activeTab === 'Overall' ? `<div class="summary-block"><h2>Period Totals</h2>${overallSummaryHtml(data)}</div>` : ''}
        ${sections.map((section, index) => renderSection(section, activeTab === 'Overall' ? index + 1 : index)).join('')}

        <div class="footer">
          <span>Printed from Broiler 360 — Professional Monochrome Report System</span>
          <span>Page Reference & Auditing</span>
        </div>
      </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    // printToFileAsync writes under cache/Print/… which scoped FilePermissionService
    // often denies to Sharing. Rewrite into Expo's allowed cacheDirectory first.
    const { base64 } = await Print.printToFileAsync({ html, base64: true });
    if (!base64) {
      throw new Error('PDF generation returned empty content.');
    }

    const cacheRoot = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!cacheRoot) {
      throw new Error('No writable app directory available for PDF export.');
    }

    const targetUri = `${cacheRoot}Broiler360_${activeTab}_Report_${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(targetUri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${activeTab} Report`,
      });
    } else {
      Alert.alert('PDF Created', `Saved to temporary file: ${targetUri}`);
    }
  } catch (error: any) {
    Alert.alert('Export Error', error?.message || 'Failed to generate PDF report.');
  }
}
