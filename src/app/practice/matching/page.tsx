'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import type { Word } from '@/types';

type SessionState = 'loading' | 'empty' | 'active' | 'done';

interface MatchItem {
  id: string; // word ID
  text: string;
}

export default function MatchingPage() {
  const { words, loading } = useWords();
  const [state, setState] = useState<SessionState>('loading');
  const [leftItems, setLeftItems] = useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchItem[]>([]);
  
  // Selection states
  const [selectedLeft, setSelectedLeft] = useState<MatchItem | null>(null);
  const [selectedRight, setSelectedRight] = useState<MatchItem | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  
  // Error states for animation
  const [errorLeftId, setErrorLeftId] = useState<string | null>(null);
  const [errorRightId, setErrorRightId] = useState<string | null>(null);

  // Statistics
  const [round, setRound] = useState(1);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Load a round of 5 words
  const startRound = (roundNumber: number, allWords: Word[]) => {
    if (allWords.length < 3) {
      setTimeout(() => setState('empty'), 0);
      return;
    }

    // Pick 5 random words (or less if not enough words)
    const limit = Math.min(5, allWords.length);
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, limit);

    const left = selected.map(w => ({ id: w.id, text: w.word })).sort(() => Math.random() - 0.5);
    const right = selected.map(w => ({ id: w.id, text: w.meaning })).sort(() => Math.random() - 0.5);

    setTimeout(() => {
      setLeftItems(left);
      setRightItems(right);
      setMatchedIds(new Set());
      setSelectedLeft(null);
      setSelectedRight(null);
      setRound(roundNumber);
      setState('active');
    }, 0);
  };

  useEffect(() => {
    if (!loading) {
      if (words.length < 3) {
        setTimeout(() => setState('empty'), 0);
      } else {
        setTimeout(() => {
          setStartTime(Date.now());
          setElapsedTime(0);
          setCorrectMatches(0);
          setWrongCount(0);
          startRound(1, words);
        }, 0);
      }
    }
  }, [words, loading]);

  // Keep track of elapsed time
  useEffect(() => {
    if (state === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, startTime]);

  // Match checking logic
  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const leftId = selectedLeft.id;
      const rightId = selectedRight.id;

      if (leftId === rightId) {
        // Correct match!
        setTimeout(() => {
          setMatchedIds(prev => {
            const updated = new Set(prev);
            updated.add(leftId);
            return updated;
          });
          setCorrectMatches(c => c + 1);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 0);
      } else {
        // Incorrect match!
        setTimeout(() => {
          setWrongCount(w => w + 1);
          setErrorLeftId(selectedLeft.id);
          setErrorRightId(selectedRight.id);
        }, 0);

        const timer = setTimeout(() => {
          setErrorLeftId(null);
          setErrorRightId(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [selectedLeft, selectedRight]);

  // Check if round is complete
  useEffect(() => {
    if (state === 'active' && matchedIds.size > 0 && matchedIds.size === leftItems.length) {
      // Round completed!
      const timer = setTimeout(() => {
        // If there are more words to review, we can start another round, otherwise end the session.
        // Let's finish the game after 3 rounds or when we run out of words.
        if (round < 3 && words.length >= 5) {
          startRound(round + 1, words);
        } else {
          setTimeout(() => setState('done'), 0);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [matchedIds, leftItems, round, state, words]);

  const handleSelectLeft = (item: MatchItem) => {
    if (matchedIds.has(item.id) || errorLeftId) return;
    setSelectedLeft(selectedLeft?.id === item.id ? null : item);
  };

  const handleSelectRight = (item: MatchItem) => {
    if (matchedIds.has(item.id) || errorRightId) return;
    setSelectedRight(selectedRight?.id === item.id ? null : item);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const resetGame = () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    setCorrectMatches(0);
    setWrongCount(0);
    startRound(1, words);
  };

  if (state === 'loading') {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="skeleton" style={{ width: '200px', height: '24px' }} />
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Link href="/practice" className="btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Ghép từ và nghĩa</h1>
        </div>

        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <HelpCircle size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '16px', color: 'var(--text-primary)' }}>Chưa đủ từ vựng</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '8px' }}>
            Bạn cần có ít nhất 3 từ vựng trong bộ sưu tập để tham gia trò chơi ghép từ.
          </p>
          <Link href="/add-word" className="btn-primary" style={{ marginTop: '24px' }}>
            Thêm từ vựng ngay
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'done') {
    const totalSelected = correctMatches + wrongCount;
    const accuracy = totalSelected > 0 ? Math.round((correctMatches / totalSelected) * 100) : 0;

    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', paddingTop: '40px' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Ghép từ hoàn thành!
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Bạn đã hoàn thành ghép các cặp từ vựng.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '32px 0' }}>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--rating-good)', fontFamily: 'var(--font-mono)' }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Độ chính xác</div>
            </div>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {correctMatches}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Số cặp đúng</div>
            </div>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatTime(elapsedTime)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thời gian</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px' }}>
            <Link href="/practice" className="btn-secondary">
              Về danh sách
            </Link>
            <button onClick={resetGame} className="btn-primary">
              <RotateCcw size={16} /> Chơi lại
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - var(--nav-height))' }}>
      
      {/* Header Area */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/practice" className="btn-icon" style={{ width: '32px', height: '32px' }}>
              <ArrowLeft size={18} />
            </Link>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Vòng {round} / {words.length >= 5 ? 3 : 1}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              ⏱️ {formatTime(elapsedTime)}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--rating-good)', fontWeight: 600 }}>
              ✅ {matchedIds.size} / {leftItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* Matching columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          flex: 1,
          alignItems: 'stretch',
          alignContent: 'start',
          marginBottom: '24px',
        }}
      >
        {/* Left Column (English words) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.5px' }}>
            Từ tiếng Anh
          </div>
          {leftItems.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedLeft?.id === item.id;
            const isError = errorLeftId === item.id;
            
            let bg = 'var(--bg-secondary)';
            let border = '1px solid var(--border)';
            let color = 'var(--text-primary)';
            
            if (isMatched) {
              bg = 'var(--rating-good-bg)';
              border = '1px solid var(--rating-good)';
              color = 'var(--rating-good)';
            } else if (isError) {
              bg = 'var(--rating-forgot-bg)';
              border = '2px solid var(--rating-forgot)';
              color = 'var(--rating-forgot)';
            } else if (isSelected) {
              bg = 'var(--accent-light)';
              border = '2px solid var(--accent)';
              color = 'var(--accent)';
            }

            return (
              <motion.button
                key={`left-${item.id}`}
                layout
                animate={isError ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.3 }}
                onClick={() => handleSelectLeft(item)}
                disabled={isMatched}
                style={{
                  padding: '16px 12px',
                  background: bg,
                  border,
                  color,
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '15px',
                  fontWeight: 600,
                  textAlign: 'center',
                  cursor: isMatched ? 'default' : 'pointer',
                  opacity: isMatched ? 0.35 : 1,
                  minHeight: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.text}
              </motion.button>
            );
          })}
        </div>

        {/* Right Column (Vietnamese meaning) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.5px' }}>
            Nghĩa tiếng Việt
          </div>
          {rightItems.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedRight?.id === item.id;
            const isError = errorRightId === item.id;
            
            let bg = 'var(--bg-secondary)';
            let border = '1px solid var(--border)';
            let color = 'var(--text-primary)';
            
            if (isMatched) {
              bg = 'var(--rating-good-bg)';
              border = '1px solid var(--rating-good)';
              color = 'var(--rating-good)';
            } else if (isError) {
              bg = 'var(--rating-forgot-bg)';
              border = '2px solid var(--rating-forgot)';
              color = 'var(--rating-forgot)';
            } else if (isSelected) {
              bg = 'var(--accent-light)';
              border = '2px solid var(--accent)';
              color = 'var(--accent)';
            }

            return (
              <motion.button
                key={`right-${item.id}`}
                layout
                animate={isError ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.3 }}
                onClick={() => handleSelectRight(item)}
                disabled={isMatched}
                style={{
                  padding: '16px 12px',
                  background: bg,
                  border,
                  color,
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center',
                  cursor: isMatched ? 'default' : 'pointer',
                  opacity: isMatched ? 0.35 : 1,
                  minHeight: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}
              >
                {item.text}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Help message */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        Nhấn một từ tiếng Anh và nghĩa tiếng Việt tương ứng để nối chúng với nhau.
      </div>
    </div>
  );
}
