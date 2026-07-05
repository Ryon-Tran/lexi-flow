'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import type { Word } from '@/types';

type SessionState = 'loading' | 'empty' | 'active' | 'feedback' | 'done';

interface Question {
  word: Word;
  hintText: string; // e.g. "p _ o _ u _ e"
}

export default function LetterHintPage() {
  const { words, loading } = useWords();
  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ question: Question; isCorrect: boolean; userAnswer: string }[]>([]);
  
  // Statistics
  const [streak, setStreak] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to generate character hint
  const generateHint = (wordText: string): string => {
    const cleanWord = wordText.trim();
    const len = cleanWord.length;
    
    // Find indices that are alphabetic
    const letterIndices: number[] = [];
    for (let i = 0; i < len; i++) {
      if (/[a-zA-Z]/.test(cleanWord[i])) {
        letterIndices.push(i);
      }
    }

    const letterCount = letterIndices.length;
    if (letterCount <= 1) return cleanWord;

    const revealCount = Math.max(1, Math.min(letterCount - 1, Math.round(letterCount * 0.45)));
    
    const indicesToReveal = new Set<number>();
    const shuffledIndices = [...letterIndices].sort(() => Math.random() - 0.5);
    shuffledIndices.slice(0, revealCount).forEach(idx => indicesToReveal.add(idx));

    let hint = '';
    for (let i = 0; i < len; i++) {
      if (!/[a-zA-Z]/.test(cleanWord[i])) {
        hint += cleanWord[i]; // keep space/hyphen
      } else if (indicesToReveal.has(i)) {
        hint += cleanWord[i];
      } else {
        hint += '_';
      }
    }

    // Format with spacing: e.g. "p _ o _ u _ e"
    return hint.split('').join(' ');
  };

  // Initialize session
  useEffect(() => {
    if (!loading) {
      if (words.length === 0) {
        setTimeout(() => setState('empty'), 0);
      } else {
        const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 15);
        const generated = shuffled.map(w => ({
          word: w,
          hintText: generateHint(w.word)
        }));
        
        setTimeout(() => {
          setQuestions(generated);
          setState('active');
          setCurrentIndex(0);
          setUserAnswer('');
          setResults([]);
          setStreak(0);
        }, 0);
      }
    }
  }, [words, loading]);

  const currentQ = questions[currentIndex];

  const handleCheck = useCallback(() => {
    if (state !== 'active' || !userAnswer.trim() || !currentQ) return;

    const isCorrect = userAnswer.trim().toLowerCase() === currentQ.word.word.toLowerCase();
    
    setResults(prev => [
      ...prev,
      { question: currentQ, isCorrect, userAnswer }
    ]);

    if (isCorrect) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    setState('feedback');
  }, [state, userAnswer, currentQ]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setUserAnswer('');
      setState('active');
    } else {
      setState('done');
    }
  }, [currentIndex, questions.length]);

  const resetSession = () => {
    if (words.length === 0) {
      setState('empty');
      return;
    }
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 15);
    const generated = shuffled.map(w => ({
      word: w,
      hintText: generateHint(w.word)
    }));
    
    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswer('');
    setResults([]);
    setStreak(0);
    setState('active');
  };

  // Keyboard shortcut: Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (state === 'active' && userAnswer.trim()) {
          e.preventDefault();
          handleCheck();
        } else if (state === 'feedback') {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, userAnswer, currentIndex, questions, handleCheck, handleNext]);

  // Focus input
  useEffect(() => {
    if (state === 'active') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [state, currentIndex]);

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
          <h1 className="page-title" style={{ marginBottom: 0 }}>Gợi ý ký tự</h1>
        </div>

        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <HelpCircle size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '16px', color: 'var(--text-primary)' }}>Chưa có từ vựng</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '8px' }}>
            Vui lòng thêm từ vựng để bắt đầu thực hiện bài luyện tập gợi ý ký tự.
          </p>
          <Link href="/add-word" className="btn-primary" style={{ marginTop: '24px' }}>
            Thêm từ mới
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'done') {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100) || 0;

    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', paddingTop: '40px' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💡</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Hoàn thành!
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Bạn đã ôn tập xong {results.length} từ vựng.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '32px 0' }}>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--rating-good)', fontFamily: 'var(--font-mono)' }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chính xác</div>
            </div>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {correctCount}/{results.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Từ đúng</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px' }}>
            <Link href="/practice" className="btn-secondary">
              Về danh sách
            </Link>
            <button onClick={resetSession} className="btn-primary">
              <RotateCcw size={16} /> Luyện tập tiếp
            </button>
          </div>

          {/* Error Summary */}
          {results.filter(r => !r.isCorrect).length > 0 && (
            <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Các từ đã trả lời sai:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.filter(r => !r.isCorrect).map((r, i) => (
                  <div key={i} className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.question.word.word}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {r.question.word.meaning}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--rating-forgot)', marginTop: '6px' }}>
                      Bạn đã nhập: {r.userAnswer || '(trống)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const currentResult = results.find(r => r.question.word.id === currentQ?.word.id);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - var(--nav-height))' }}>
      
      {/* Header Area */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/practice" className="btn-icon" style={{ width: '32px', height: '32px' }}>
              <ArrowLeft size={18} />
            </Link>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>
          {streak > 1 && (
            <span style={{ color: 'var(--rating-hard)', fontWeight: 700, fontSize: '14px' }}>
              🔥 {streak} Combo
            </span>
          )}
        </div>
        
        <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + (state === 'feedback' ? 1 : 0)) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'var(--accent)', borderRadius: 'var(--radius-full)' }}
          />
        </div>
      </div>

      {/* Main Hint Dictation Area */}
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div className="glass-card" style={{ padding: '36px 24px', textAlign: 'center' }}>
          
          <span className="badge badge-outline" style={{ marginBottom: '18px' }}>
            Gợi ý ký tự
          </span>

          {/* Meaning display */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Nghĩa tiếng Việt
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {currentQ.word.meaning}
            </h3>
          </div>

          {/* Hints display */}
          <div 
            style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: 'var(--accent)', 
              fontFamily: 'var(--font-mono)', 
              letterSpacing: '4px',
              marginBottom: '32px',
              padding: '8px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block'
            }}
          >
            {currentQ.hintText}
          </div>

          {/* User Input field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Gõ từ hoàn chỉnh..."
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              disabled={state === 'feedback'}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                fontSize: '20px',
                textAlign: 'center',
                padding: '12px',
                fontWeight: 600,
                borderColor: state === 'feedback'
                  ? (currentResult?.isCorrect ? 'var(--rating-good)' : 'var(--rating-forgot)')
                  : 'var(--border)',
                backgroundColor: state === 'feedback'
                  ? (currentResult?.isCorrect ? 'var(--rating-good-bg)' : 'var(--rating-forgot-bg)')
                  : 'var(--bg-primary)'
              }}
            />

            {state === 'active' ? (
              <button
                onClick={handleCheck}
                disabled={!userAnswer.trim()}
                className="btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Tiếp tục <ArrowRight size={16} />
              </button>
            )}
          </div>

          {/* Feedback Area */}
          {state === 'feedback' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '8px' }}>
                {currentResult?.isCorrect ? '✨ Chính xác!' : `❌ Từ đúng: ${currentQ.word.word}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', fontSize: '14px' }}>
                {currentQ.word.ipa && (
                  <>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Phiên âm:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{currentQ.word.ipa}</span>
                  </>
                )}
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Từ loại:</span>
                <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{currentQ.word.pos || '—'}</span>
                
                {currentQ.word.example && (
                  <>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Ví dụ:</span>
                    <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{currentQ.word.example}</span>
                  </>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
