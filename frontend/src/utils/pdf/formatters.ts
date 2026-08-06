export type ReportTab = 'Overall' | 'Purchases' | 'Sales' | 'Expenses';

export interface ExportReportOptions {
  activeTab: ReportTab;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: string;
  data: any;
}

export type SectionHtml = {
  title: string;
  tableHeader: string;
  tableBody: string;
  tableFooter: string;
};

export function formatCurr(num?: number | string): string {
  if (num == null) return '₹0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '₹0';
  return `₹${Number(n.toFixed(2)).toLocaleString('en-IN')}`;
}

export function formatNum(num?: number | string): string {
  if (num == null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (Number.isNaN(n)) return '0';
  return Number(n.toFixed(2)).toLocaleString('en-IN');
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sectionHasRows(section: SectionHtml): boolean {
  return Boolean(section.tableBody && section.tableBody.trim());
}

export function renderSection(section: SectionHtml, index: number): string {
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

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export async function generateAndSharePdf(html: string, fileNamePrefix: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    const { base64 } = await Print.printToFileAsync({ html, base64: true });
    if (!base64) {
      throw new Error('PDF generation returned empty content.');
    }

    const cacheRoot = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!cacheRoot) {
      throw new Error('No writable app directory available for PDF export.');
    }

    const targetUri = `${cacheRoot}Broiler360_${fileNamePrefix}_Report_${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(targetUri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${fileNamePrefix} Report`,
      });
    } else {
      Alert.alert('PDF Created', `Saved to temporary file: ${targetUri}`);
    }
  } catch (error: any) {
    Alert.alert('Export Error', error?.message || 'Failed to generate PDF report.');
  }
}
