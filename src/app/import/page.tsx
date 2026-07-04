'use client';

import { useState, useRef } from 'react';

import { motion } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { parseExcelFile, validateRows, generateTemplate } from '@/lib/excel';
import { useWords } from '@/hooks/use-words';
import type { ImportValidation, WordFormData, ConflictStrategy } from '@/types';

type ImportStep = 'upload' | 'preview' | 'importing' | 'done';

export default function ImportPage() {
  const { words, bulkInsert } = useWords();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('upload');
  const [validations, setValidations] = useState<ImportValidation[]>([]);
  const [conflictStrategy, setConflictStrategy] =
    useState<ConflictStrategy>('skip');
  const [fileName, setFileName] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);

    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls')
    ) {
      setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseExcelFile(buffer);

      if (rows.length === 0) {
        setError('File không có dữ liệu');
        return;
      }

      const results = validateRows(rows, words);
      setValidations(results);
      setStep('preview');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể đọc file Excel'
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);

    const validItems: WordFormData[] = [];
    let skipped = 0;

    validations.forEach((v) => {
      if (v.status === 'error') {
        skipped++;
        return;
      }

      if (v.status === 'duplicate') {
        if (conflictStrategy === 'skip') {
          skipped++;
          return;
        }
        // 'overwrite' or 'update' — include it (upsert handles it)
      }

      validItems.push({
        word: v.row.word,
        pos: v.row.pos,
        ipa: v.row.ipa,
        meaning: v.row.meaning,
        phrase: v.row.phrase,
        example: v.row.example,
        family: '',
        topic: '',
        note: v.row.note,
        source: '',
      });
    });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const result = await bulkInsert(validItems);

      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult({
        success: result.success,
        failed: result.failed,
        skipped,
      });
      setStep('done');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Import thất bại'
      );
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const buffer = generateTemplate();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lexi-flow-template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStep('upload');
    setValidations([]);
    setFileName('');
    setError(null);
    setImportResult(null);
  };

  const errorCount = validations.filter((v) => v.status === 'error').length;
  const duplicateCount = validations.filter(
    (v) => v.status === 'duplicate'
  ).length;
  const validCount = validations.filter((v) => v.status === 'valid').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/" className="btn-icon">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Import Excel
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Nhập hàng loạt từ vựng từ file .xlsx
          </p>
        </div>
      </div>

      {/* ======================== Upload Step ======================== */}
      {step === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '60px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent)',
              }}
            >
              <Upload size={24} />
            </div>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              {isDragging ? 'Thả file vào đây' : 'Chọn hoặc kéo thả file Excel'}
            </p>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-tertiary)',
              }}
            >
              Hỗ trợ file .xlsx và .xls
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 16px',
                background: 'var(--rating-forgot-bg)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--rating-forgot)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Template Download */}
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={downloadTemplate}
              className="btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
              }}
            >
              <Download size={16} /> Tải file mẫu (.xlsx)
            </button>

            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>
                Cấu trúc cột:
              </strong>
              <br />
              Word | Part of speech | Transcription | Meaning | Phrase | Example | Note
            </div>
          </div>
        </motion.div>
      )}

      {/* ======================== Preview Step ======================== */}
      {step === 'preview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* File info */}
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                background: 'var(--rating-forgot-bg)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--rating-forgot)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div
            className="glass-card"
            style={{
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <FileSpreadsheet size={20} style={{ color: 'var(--rating-good)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fileName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {validations.length} dòng dữ liệu
              </div>
            </div>
            <button onClick={reset} className="btn-ghost" style={{ fontSize: '13px' }}>
              Đổi file
            </button>
          </div>

          {/* Summary stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <div className="stat-card" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--rating-good)' }}>
                {validCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hợp lệ</div>
            </div>
            <div className="stat-card" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--rating-hard)' }}>
                {duplicateCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Trùng</div>
            </div>
            <div className="stat-card" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--rating-forgot)' }}>
                {errorCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Lỗi</div>
            </div>
          </div>

          {/* Conflict strategy */}
          {duplicateCount > 0 && (
            <div
              className="glass-card"
              style={{ padding: '16px', marginBottom: '16px' }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '10px',
                }}
              >
                Xử lý {duplicateCount} từ bị trùng:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {[
                  { value: 'skip' as const, label: 'Bỏ qua', desc: 'Giữ nguyên từ cũ' },
                  { value: 'overwrite' as const, label: 'Ghi đè', desc: 'Thay thế bằng dữ liệu mới' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background:
                        conflictStrategy === opt.value
                          ? 'var(--accent-light)'
                          : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value={opt.value}
                      checked={conflictStrategy === opt.value}
                      onChange={() => setConflictStrategy(opt.value)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview List */}
          <div style={{ marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {validations.slice(0, 50).map((v, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              >
                {v.status === 'valid' && (
                  <CheckCircle2 size={16} style={{ color: 'var(--rating-good)', flexShrink: 0 }} />
                )}
                {v.status === 'duplicate' && (
                  <AlertCircle size={16} style={{ color: 'var(--rating-hard)', flexShrink: 0 }} />
                )}
                {v.status === 'error' && (
                  <XCircle size={16} style={{ color: 'var(--rating-forgot)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {v.row.word || '(trống)'}
                  </div>
                  {v.errors.length > 0 && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--rating-forgot)',
                      }}
                    >
                      {v.errors.join(', ')}
                    </div>
                  )}
                  {v.status === 'duplicate' && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--rating-hard)',
                      }}
                    >
                      Đã tồn tại trong bộ sưu tập
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Dòng {v.row.rowNumber}
                </span>
              </div>
            ))}
            {validations.length > 50 && (
              <div
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-tertiary)',
                }}
              >
                ... và {validations.length - 50} dòng nữa
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={reset} className="btn-secondary" style={{ flex: 1 }}>
              Huỷ
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleImport}
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={validCount + (conflictStrategy !== 'skip' ? duplicateCount : 0) === 0}
            >
              Import{' '}
              {validCount + (conflictStrategy !== 'skip' ? duplicateCount : 0)}{' '}
              từ
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ======================== Importing Step ======================== */}
      {step === 'importing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: '24px',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <RefreshCw size={32} style={{ color: 'var(--accent)' }} />
          </motion.div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Đang import...
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {importProgress}%
            </div>
          </div>
          <div
            style={{
              width: '200px',
              height: '4px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${importProgress}%` }}
              style={{
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
        </motion.div>
      )}

      {/* ======================== Done Step ======================== */}
      {step === 'done' && importResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            paddingTop: '60px',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>
            {importResult.success > 0 ? '✅' : '⚠️'}
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Import hoàn tất!
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '24px',
              marginBottom: '32px',
            }}
          >
            <div className="stat-card" style={{ minWidth: '80px', padding: '14px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--rating-good)' }}>
                {importResult.success}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Thành công
              </div>
            </div>
            <div className="stat-card" style={{ minWidth: '80px', padding: '14px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-tertiary)' }}>
                {importResult.skipped}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Bỏ qua
              </div>
            </div>
            {importResult.failed > 0 && (
              <div className="stat-card" style={{ minWidth: '80px', padding: '14px' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--rating-forgot)' }}>
                  {importResult.failed}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Thất bại
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={reset} className="btn-secondary">
              Import thêm
            </button>
            <Link href="/words" className="btn-primary">
              Xem từ vựng
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
