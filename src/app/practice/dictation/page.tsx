'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, ArrowRight, HelpCircle, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import type { Word } from '@/types';

type SessionState = 'loading' | 'empty' | 'active' | 'feedback' | 'done';

interface Question {
  word: Word;
}

export default function DictationPage() {
  const { words, loading } = useWords();
  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ question: Question; isCorrect: boolean; userAnswer: string }[]>([]);
  
  // Audio state
  const [playCount, setPlayCount] = useState(0);
  const maxPlays = 3;

  // Statistics
  const [streak, setStreak] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize questions
  useEffect(() => {
    if (!loading) {
      if (words.length === 0) {
        setTimeout(() => setState('empty'), 0);
      } else {
        const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 15);
        setTimeout(() => {
          setQuestions(shuffled.map(w => ({ word: w })));
          setState('active');
          setCurrentIndex(0);
          setUserAnswer('');
          setResults([]);
          setStreak(0);
          setPlayCount(0);
        }, 0);
      }
    }
  }, [words, loading]);

  const currentQ = questions[currentIndex];

  // Core TTS speak logic with rate control
  const speakWord = useCallback((text: string, rate: number = 0.9) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Voice selection
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang === 'en-US' && v.name.includes('Google')
    ) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  // Autoplay current word on mount/index change
  useEffect(() => {
    if (state === 'active' && currentQ) {
      const timer = setTimeout(() => {
        speakWord(currentQ.word.word);
        setPlayCount(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, currentIndex, currentQ, speakWord]);

  const handlePlayAudio = (rate: number = 0.9) => {
    if (!currentQ) return;
    if (state === 'active' && playCount >= maxPlays) return;

    speakWord(currentQ.word.word, rate);
    if (state === 'active') {
      setPlayCount(p => p + 1);
    }
  };

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
      setPlayCount(0);
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
    setQuestions(shuffled.map(w => ({ word: w })));
    setCurrentIndex(0);
    setUserAnswer('');
    setResults([]);
    setStreak(0);
    setPlayCount(0);
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
          <h1 className="page-title" style={{ marginBottom: 0 }}>Nghe và gõ lại</h1>
        </div>

        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <HelpCircle size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '16px', color: 'var(--text-primary)' }}>Chưa có từ vựng</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '8px' }}>
            Vui lòng thêm từ vựng để bắt đầu thực hiện bài luyện tập nghe.
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎧</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Chính tả hoàn thành!
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Bạn đã nghe xong {results.length} từ vựng.
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
                Các từ cần ôn lại chính tả:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.filter(r => !r.isCorrect).map((r, i) => (
                  <div key={i} className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.question.word.word}
                      </span>
                      <button onClick={() => speakWord(r.question.word.word)} className="btn-icon" style={{ width: 28, height: 28 }}>
                        <Volume2 size={15} />
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0' }}>
                      Phiên âm: {r.question.word.ipa || '—'} · Nghĩa: {r.question.word.meaning}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--rating-forgot)' }}>
                      Bạn đã gõ: {r.userAnswer || '(trống)'}
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
  const remainingPlays = Math.max(0, maxPlays - playCount);

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
              Từ {currentIndex + 1} / {questions.length}
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

      {/* Main Dictation Area */}
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div className="glass-card" style={{ padding: '36px 24px', textAlign: 'center' }}>
          
          <span className="badge badge-outline" style={{ marginBottom: '24px' }}>
            Nghe &amp; Gõ chính tả
          </span>

          {/* Sound play buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
            {/* Standard speed */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePlayAudio(0.95)}
                disabled={state === 'active' && remainingPlays === 0}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: (state === 'active' && remainingPlays === 0) ? 'not-allowed' : 'pointer',
                  opacity: (state === 'active' && remainingPlays === 0) ? 0.45 : 1,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <Volume2 size={32} />
              </motion.button>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Tốc độ thường
              </span>
            </div>

            {/* Slow play */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePlayAudio(0.55)}
                disabled={state === 'active' && remainingPlays === 0}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: (state === 'active' && remainingPlays === 0) ? 'not-allowed' : 'pointer',
                  opacity: (state === 'active' && remainingPlays === 0) ? 0.45 : 1,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700 }}>🐢 CHẬM</span>
              </motion.button>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Tốc độ 0.55x
              </span>
            </div>
          </div>

          {state === 'active' && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Số lượt nghe còn lại: <strong>{remainingPlays}</strong> / {maxPlays}
            </div>
          )}

          {/* User Input field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Gõ từ bạn nghe được..."
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
                {currentResult?.isCorrect ? '✨ Chính xác!' : `❌ Đáp án đúng: ${currentQ.word.word}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Phiên âm:</span>
                <span style={{ color: 'var(--text-primary)' }}>{currentQ.word.ipa || '—'}</span>
                
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Từ loại:</span>
                <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{currentQ.word.pos || '—'}</span>
                
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Định nghĩa:</span>
                <span style={{ color: 'var(--text-primary)' }}>{currentQ.word.meaning}</span>
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
