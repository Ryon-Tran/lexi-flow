// ============================================
// LexiFlow — Excel Parser
// ============================================
// Parses .xlsx files and maps columns to word fields.

import * as XLSX from 'xlsx';
import type { ExcelRow, ImportValidation, Word } from '@/types';
import { EXCEL_COLUMNS } from './constants';

/**
 * Parse an Excel file buffer into structured rows.
 */
export function parseExcelFile(buffer: ArrayBuffer): ExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Get raw data as array of arrays
  const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (rawData.length < 2) {
    throw new Error('File Excel phải có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu');
  }

  // Map headers to field names
  const headers = rawData[0].map((h) => String(h).trim().toLowerCase());
  const columnMap = mapColumns(headers);

  // Parse data rows
  const rows: ExcelRow[] = [];
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.every((cell) => !cell || String(cell).trim() === '')) {
      continue; // Skip empty rows
    }

    rows.push({
      word: getCellValue(row, columnMap.word),
      pos: getCellValue(row, columnMap.pos),
      ipa: getCellValue(row, columnMap.ipa),
      meaning: getCellValue(row, columnMap.meaning),
      phrase: getCellValue(row, columnMap.phrase),
      example: getCellValue(row, columnMap.example),
      note: getCellValue(row, columnMap.note),
      rowNumber: i + 1, // 1-indexed, +1 for header row
    });
  }

  return rows;
}

/**
 * Map Excel header names to our field names.
 */
function mapColumns(
  headers: string[]
): Record<keyof typeof EXCEL_COLUMNS, number> {
  const result: Record<string, number> = {};

  for (const [field, aliases] of Object.entries(EXCEL_COLUMNS)) {
    const index = headers.findIndex((h) =>
      aliases.some((alias) => h.includes(alias))
    );
    result[field] = index;
  }

  return result as Record<keyof typeof EXCEL_COLUMNS, number>;
}

/**
 * Get cell value by column index, returning empty string if not found.
 */
function getCellValue(row: string[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  return String(row[index] || '').trim();
}

/**
 * Validate parsed rows against existing words.
 */
export function validateRows(
  rows: ExcelRow[],
  existingWords: Word[]
): ImportValidation[] {
  const existingMap = new Map(
    existingWords.map((w) => [w.word.toLowerCase(), w])
  );
  const seenInBatch = new Set<string>();

  return rows.map((row) => {
    const errors: string[] = [];

    // Required field validation
    if (!row.word) {
      errors.push('Thiếu từ vựng (Word)');
    }
    if (!row.meaning) {
      errors.push('Thiếu nghĩa (Meaning)');
    }

    // Check for duplicates within the batch
    const wordLower = row.word.toLowerCase();
    if (seenInBatch.has(wordLower)) {
      errors.push('Trùng lặp trong file');
    }
    seenInBatch.add(wordLower);

    // Check against existing words
    const existing = existingMap.get(wordLower);
    if (existing && errors.length === 0) {
      return {
        row,
        status: 'duplicate' as const,
        errors: [],
        existingWord: existing,
      };
    }

    return {
      row,
      status: errors.length > 0 ? ('error' as const) : ('valid' as const),
      errors,
    };
  });
}

/**
 * Generate a download template Excel file.
 */
export function generateTemplate(): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Word', 'Part of speech', 'Transcription', 'Meaning', 'Phrase', 'Example', 'Note'],
    ['accomplish', 'verb', '/əˈkɑːmplɪʃ/', 'hoàn thành, đạt được', 'accomplish a goal', 'She accomplished all her tasks before the deadline.', 'TOEIC Part 5'],
  ]);

  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // Word
    { wch: 15 }, // POS
    { wch: 20 }, // Transcription
    { wch: 30 }, // Meaning
    { wch: 25 }, // Phrase
    { wch: 50 }, // Example
    { wch: 20 }, // Note
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vocabulary');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
