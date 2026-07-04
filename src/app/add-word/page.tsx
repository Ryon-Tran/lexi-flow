'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import { POS_OPTIONS, TOPIC_OPTIONS } from '@/lib/constants';
import type { WordFormData } from '@/types';

const initialForm: WordFormData = {
  word: '',
  pos: '',
  ipa: '',
  meaning: '',
  phrase: '',
  example: '',
  family: '',
  topic: '',
  note: '',
  source: '',
};

export default function AddWordPage() {
  const { addWord } = useWords();
  const [form, setForm] = useState<WordFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.word.trim()) {
      showToast('Vui lòng nhập từ vựng', 'error');
      return;
    }
    if (!form.meaning.trim()) {
      showToast('Vui lòng nhập nghĩa', 'error');
      return;
    }

    setLoading(true);
    try {
      await addWord(form);
      showToast(`Đã thêm "${form.word}" thành công!`, 'success');
      setForm(initialForm);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Không thể thêm từ',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof WordFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/" className="btn-icon">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Thêm từ mới</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Nhập thông tin từ vựng TOEIC
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {/* Word & Meaning — required fields */}
        <div
          className="glass-card"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label className="label">
              Từ vựng <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. accomplish"
              value={form.word}
              onChange={(e) => updateField('word', e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Từ loại</label>
              <select
                className="input select"
                value={form.pos}
                onChange={(e) => updateField('pos', e.target.value)}
              >
                <option value="">Chọn...</option>
                {POS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Phiên âm (IPA)</label>
              <input
                className="input"
                type="text"
                placeholder="/əˈkɑːmplɪʃ/"
                value={form.ipa}
                onChange={(e) => updateField('ipa', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">
              Nghĩa <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="hoàn thành, đạt được"
              value={form.meaning}
              onChange={(e) => updateField('meaning', e.target.value)}
            />
          </div>
        </div>

        {/* Optional fields */}
        <div
          className="glass-card"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label className="label">Cụm từ (Phrase)</label>
            <input
              className="input"
              type="text"
              placeholder="accomplish a goal"
              value={form.phrase}
              onChange={(e) => updateField('phrase', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Ví dụ (Example)</label>
            <textarea
              className="input textarea"
              placeholder="She accomplished all her tasks before the deadline."
              value={form.example}
              onChange={(e) => updateField('example', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Họ từ (Word Family)</label>
            <input
              className="input"
              type="text"
              placeholder="accomplishment (n.), accomplished (adj.)"
              value={form.family}
              onChange={(e) => updateField('family', e.target.value)}
            />
          </div>
        </div>

        {/* Metadata */}
        <div
          className="glass-card"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label className="label">Chủ đề (Topic)</label>
            <select
              className="input select"
              value={form.topic}
              onChange={(e) => updateField('topic', e.target.value)}
            >
              <option value="">Chọn chủ đề...</option>
              {TOPIC_OPTIONS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Ghi chú</label>
              <input
                className="input"
                type="text"
                placeholder="TOEIC Part 5"
                value={form.note}
                onChange={(e) => updateField('note', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Nguồn</label>
              <input
                className="input"
                type="text"
                placeholder="ETS 2024"
                value={form.source}
                onChange={(e) => updateField('source', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          className="btn-primary"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            'Đang thêm...'
          ) : (
            <>
              <Check size={18} />
              Thêm từ vựng
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Toast */}
      {toast && (
        <div
          className="toast"
          style={{
            background:
              toast.type === 'success'
                ? 'var(--rating-good)'
                : 'var(--rating-forgot)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
