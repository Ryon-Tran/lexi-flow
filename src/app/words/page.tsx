'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  Trash2,
  Volume2,
  ChevronDown,
  X,
  BookOpen,
} from 'lucide-react';
import { useWords } from '@/hooks/use-words';
import { useTTS } from '@/hooks/use-tts';
import { TOPIC_OPTIONS } from '@/lib/constants';
import type { Word } from '@/types';

export default function WordsPage() {
  const { words, loading, deleteWord, toggleFavorite } = useWords();
  const { playWord } = useTTS();
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'alpha' | 'favorites'>(
    'newest'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredWords = useMemo(() => {
    let result = [...words];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q)
      );
    }

    // Topic filter
    if (topicFilter) {
      result = result.filter((w) => w.topic === topicFilter);
    }

    // Sort
    switch (sortBy) {
      case 'alpha':
        result.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'favorites':
        result.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
        break;
      case 'newest':
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [words, search, topicFilter, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);
      setDeleteConfirm(null);
    } catch {
      // Error handled in hook
    }
  };

  // Get unique topics from words
  const usedTopics = useMemo(
    () => [...new Set(words.filter((w) => w.topic).map((w) => w.topic!))],
    [words]
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Từ vựng</h1>
        <p className="page-subtitle">
          {words.length} từ trong bộ sưu tập
        </p>
      </div>

      {/* Search */}
      <div
        style={{
          position: 'relative',
          marginBottom: '12px',
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
          }}
        />
        <input
          className="input"
          type="text"
          placeholder="Tìm từ hoặc nghĩa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '42px' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="btn-icon"
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter & Sort Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters || topicFilter ? 'badge' : 'badge badge-outline'}
          style={{ cursor: 'pointer', border: 'none', padding: '6px 12px' }}
        >
          Chủ đề <ChevronDown size={12} />
        </button>
        {(['newest', 'alpha', 'favorites'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={sortBy === s ? 'badge' : 'badge badge-outline'}
            style={{ cursor: 'pointer', border: sortBy === s ? 'none' : undefined }}
          >
            {s === 'newest' ? 'Mới nhất' : s === 'alpha' ? 'A → Z' : '⭐ Yêu thích'}
          </button>
        ))}
      </div>

      {/* Topic Filter Dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              overflow: 'hidden',
              marginBottom: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <button
              onClick={() => setTopicFilter('')}
              className={!topicFilter ? 'badge' : 'badge badge-outline'}
              style={{ cursor: 'pointer', fontSize: '12px' }}
            >
              Tất cả
            </button>
            {(usedTopics.length > 0 ? usedTopics : TOPIC_OPTIONS as unknown as string[]).map((t) => (
              <button
                key={t}
                onClick={() => setTopicFilter(topicFilter === t ? '' : t)}
                className={topicFilter === t ? 'badge' : 'badge badge-outline'}
                style={{ cursor: 'pointer', fontSize: '12px' }}
              >
                {t}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '72px' }} />
          ))}
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} />
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '4px',
            }}
          >
            {search || topicFilter ? 'Không tìm thấy từ nào' : 'Chưa có từ vựng'}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
            {search || topicFilter
              ? 'Thử thay đổi bộ lọc'
              : 'Bắt đầu thêm từ mới hoặc import từ Excel'}
          </p>
        </div>
      ) : (
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <AnimatePresence>
            {filteredWords.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                isExpanded={expandedId === word.id}
                onToggle={() =>
                  setExpandedId(expandedId === word.id ? null : word.id)
                }
                onFavorite={() => toggleFavorite(word.id)}
                onDelete={() => setDeleteConfirm(word.id)}
                onSpeak={() => playWord(word.word)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--bg-overlay)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              padding: '16px',
            }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card"
              style={{
                padding: '24px',
                maxWidth: '340px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                }}
              >
                Xoá từ này?
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px',
                }}
              >
                Hành động này không thể hoàn tác.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Huỷ
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    background: 'var(--error)',
                  }}
                >
                  Xoá
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WordCard({
  word,
  isExpanded,
  onToggle,
  onFavorite,
  onDelete,
  onSpeak,
}: {
  word: Word;
  isExpanded: boolean;
  onToggle: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onSpeak: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card"
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '2px',
            }}
          >
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {word.word}
            </span>
            {word.pos && (
              <span className="badge badge-outline" style={{ fontSize: '10px', padding: '2px 6px' }}>
                {word.pos}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {word.meaning}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          className="btn-icon"
          style={{ flexShrink: 0, width: '36px', height: '36px' }}
        >
          <Star
            size={18}
            fill={word.favorite ? 'var(--rating-hard)' : 'none'}
            color={word.favorite ? 'var(--rating-hard)' : 'var(--text-tertiary)'}
          />
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {word.ipa && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                    {word.ipa}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak();
                    }}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              )}
              {word.phrase && (
                <DetailRow label="Cụm từ" value={word.phrase} />
              )}
              {word.example && (
                <DetailRow label="Ví dụ" value={word.example} />
              )}
              {word.family && (
                <DetailRow label="Họ từ" value={word.family} />
              )}
              {word.topic && (
                <DetailRow label="Chủ đề" value={word.topic} />
              )}
              {word.note && (
                <DetailRow label="Ghi chú" value={word.note} />
              )}

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeak();
                  }}
                  className="btn-ghost"
                  style={{ fontSize: '13px' }}
                >
                  <Volume2 size={14} /> Phát âm
                </button>
                <div style={{ flex: 1 }} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="btn-ghost"
                  style={{
                    fontSize: '13px',
                    color: 'var(--error)',
                  }}
                >
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontSize: '14px',
          color: 'var(--text-primary)',
          marginTop: '2px',
        }}
      >
        {value}
      </div>
    </div>
  );
}
