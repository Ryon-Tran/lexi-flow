'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useReviews } from '@/hooks/use-reviews';
import { useTTS } from '@/hooks/use-tts';
import { RATING_OPTIONS } from '@/lib/constants';
import { calculateSM2, getIntervalLabel } from '@/lib/sm2';
import type { WordWithReview, Rating, SessionResult } from '@/types';

type SessionState = 'loading' | 'pre' | 'active' | 'done';

export default function LearnPage() {
  const { getDueWords, submitRating } = useReviews();
  const { playWord } = useTTS();

  const [state, setState] = useState<SessionState>('loading');
  const [words, setWords] = useState<WordWithReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWords = useCallback(async (showLoading = true) => {
    if (showLoading) setState('loading');
    try {
      const due = await getDueWords();
      setWords(due);
      setState(due.length > 0 ? 'pre' : 'pre');
    } catch {
      setWords([]);
      setState('pre');
    }
  }, [getDueWords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWords(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadWords]);

  const currentWord = words[currentIndex];
  const newCount = words.filter(
    (w) => !w.reviews || w.reviews.repetitions === 0
  ).length;
  const reviewCount = words.length - newCount;

  const startSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults([]);
    setState('active');
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Calculate predicted intervals for current word
  const getPreviewIntervals = () => {
    if (!currentWord?.reviews) return {};
    const { ease_factor, interval_days, repetitions } = currentWord.reviews;
    const previews: Record<number, string> = {};
    for (const opt of RATING_OPTIONS) {
      const result = calculateSM2({
        quality: opt.rating,
        easeFactor: ease_factor,
        interval: interval_days,
        repetitions,
      });
      previews[opt.rating] = getIntervalLabel(result.interval);
    }
    return previews;
  };
  const intervalPreviews = state === 'active' && isFlipped ? getPreviewIntervals() : {};

  // Keyboard shortcuts: Space=flip, 1-4=rate
  useEffect(() => {
    if (state !== 'active') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      }
      if (isFlipped && !isSubmitting) {
        if (e.key === '1') handleRate(0 as Rating);
        if (e.key === '2') handleRate(3 as Rating);
        if (e.key === '3') handleRate(4 as Rating);
        if (e.key === '4') handleRate(5 as Rating);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isFlipped, isSubmitting, currentWord]);

  const handleRate = async (rating: Rating) => {
    if (!currentWord || !currentWord.reviews || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await submitRating(
        currentWord.id,
        currentWord.reviews.id,
        rating,
        {
          ease_factor: currentWord.reviews.ease_factor,
          interval_days: currentWord.reviews.interval_days,
          repetitions: currentWord.reviews.repetitions,
        }
      );

      setResults((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          word: currentWord.word,
          rating,
          wasNew: currentWord.reviews!.repetitions === 0,
        },
      ]);

      // Move to next card
      if (currentIndex < words.length - 1) {
        setCurrentIndex((i) => i + 1);
        setIsFlipped(false);
      } else {
        setState('done');
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================
  // Loading State
  // ========================
  if (state === 'loading') {
    return (
      <div className="page-container">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
          }}
        >
          <div className="skeleton" style={{ width: '200px', height: '24px' }} />
          <div className="skeleton" style={{ width: '160px', height: '16px' }} />
        </div>
      </div>
    );
  }

  // ========================
  // Pre-Session Screen
  // ========================
  if (state === 'pre') {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Link href="/" className="btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Học hôm nay
          </h1>
        </div>

        {words.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="empty-state"
            style={{ minHeight: '50vh' }}
          >
            <CheckCircle2
              size={64}
              style={{ color: 'var(--rating-good)', opacity: 0.6 }}
            />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
                marginTop: '16px',
              }}
            >
              Tuyệt vời! 🎉
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              Không có từ nào cần ôn tập hôm nay.
              <br />
              Hãy thêm từ mới hoặc quay lại sau!
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <Link href="/add-word" className="btn-primary">
                Thêm từ mới
              </Link>
              <Link href="/import" className="btn-secondary">
                Import Excel
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', paddingTop: '40px' }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, var(--accent), #5856D6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: 'white',
              }}
            >
              <Sparkles size={36} />
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Sẵn sàng học!
            </h2>

            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                marginBottom: '32px',
              }}
            >
              {words.length} thẻ đang chờ bạn
            </p>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginBottom: '40px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {newCount}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Từ mới
                </div>
              </div>
              <div
                style={{
                  width: '1px',
                  background: 'var(--border)',
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    color: 'var(--rating-good)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {reviewCount}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cần ôn tập
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startSession}
              className="btn-primary"
              style={{
                padding: '16px 48px',
                fontSize: '16px',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              Bắt đầu học
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  // ========================
  // Done Screen
  // ========================
  if (state === 'done') {
    const correctCount = results.filter((r) => (r.rating as number) >= 3).length;
    const accuracy =
      results.length > 0
        ? Math.round((correctCount / results.length) * 100)
        : 0;

    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            paddingTop: '60px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              marginBottom: '16px',
            }}
          >
            🎉
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Hoàn thành!
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginBottom: '32px',
            }}
          >
            Bạn đã ôn tập xong {results.length} từ
          </p>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '40px',
            }}
          >
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 500,
                  color: 'var(--rating-good)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {accuracy}%
              </div>
              <div
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
              >
                Chính xác
              </div>
            </div>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 500,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {results.length}
              </div>
              <div
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
              >
                Tổng từ
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <Link href="/" className="btn-secondary">
              Về trang chủ
            </Link>
            <button onClick={() => loadWords()} className="btn-primary">
              <RotateCcw size={16} /> Học tiếp
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========================
  // Active Session — Flashcard
  // ========================
  if (!currentWord) return null;

  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div
      className="page-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100dvh - var(--nav-height))',
        paddingBottom: '16px',
      }}
    >
      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <Link href="/" className="btn-icon" aria-label="Quay lại trang chủ" style={{ width: '32px', height: '32px' }}>
            <ArrowLeft size={18} />
          </Link>
          <span
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {currentIndex + 1} / {words.length}
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 0',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', maxWidth: '420px' }}
          >
            <div className="flashcard-container">
              <div
                className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                onClick={handleFlip}
              >
                {/* Front */}
                <div className="flashcard-face">
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      {currentWord.word}
                    </div>

                    {currentWord.pos && (
                      <span className="badge badge-outline">
                        {currentWord.pos}
                      </span>
                    )}

                    {currentWord.ipa && (
                      <span
                        style={{
                          fontSize: '16px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {currentWord.ipa}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playWord(currentWord.word);
                      }}
                      className="btn-icon"
                      aria-label="Phát âm từ"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-light)',
                        color: 'var(--accent)',
                        marginTop: '8px',
                      }}
                    >
                      <Volume2 size={22} />
                    </button>

                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-tertiary)',
                        marginTop: '16px',
                      }}
                    >
                      Lật thẻ · Space
                    </span>
                  </div>
                </div>

                {/* Back */}
                <div className="flashcard-face flashcard-back">
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    {/* Word + meaning */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '4px',
                        }}
                      >
                        {currentWord.word}
                      </div>
                      <div
                        style={{
                          fontSize: '18px',
                          color: 'var(--accent)',
                          fontWeight: 600,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {currentWord.meaning}
                      </div>
                    </div>

                    <div
                      style={{
                        width: '40px',
                        height: '2px',
                        background: 'var(--border)',
                        margin: '0 auto',
                      }}
                    />

                    {currentWord.phrase && (
                      <BackDetail label="Cụm từ" value={currentWord.phrase} />
                    )}
                    {currentWord.example && (
                      <BackDetail
                        label="Ví dụ"
                        value={currentWord.example}
                        italic
                      />
                    )}
                    {currentWord.family && (
                      <BackDetail label="Họ từ" value={currentWord.family} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating Buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              paddingTop: '12px',
            }}
          >
            {RATING_OPTIONS.map((opt) => (
              <motion.button
                key={opt.rating}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRate(opt.rating as unknown as Rating)}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '12px 8px',
                  background:
                    opt.rating === 0
                      ? 'var(--rating-forgot-bg)'
                      : opt.rating === 3
                      ? 'var(--rating-hard-bg)'
                      : opt.rating === 4
                      ? 'var(--rating-good-bg)'
                      : 'var(--rating-easy-bg)',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color:
                      opt.rating === 0
                        ? 'var(--rating-forgot)'
                        : opt.rating === 3
                        ? 'var(--rating-hard)'
                        : opt.rating === 4
                        ? 'var(--rating-good)'
                        : 'var(--rating-easy)',
                  }}
                >
                  {opt.label}
                </span>
                {intervalPreviews[opt.rating] && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {intervalPreviews[opt.rating]}
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BackDetail({
  label,
  value,
  italic = false,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
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
          fontStyle: italic ? 'italic' : 'normal',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {value}
      </div>
    </div>
  );
}
