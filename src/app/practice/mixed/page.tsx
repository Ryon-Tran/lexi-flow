'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Flame,
  Shuffle,
  Keyboard,
  ListOrdered,
  Headphones,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import { useTTS } from '@/hooks/use-tts';
import type { Word } from '@/types';

type QuestionType = 'fill_blank' | 'letter_hint' | 'dictation' | 'multiple_choice';

interface MixedQuestion {
  word: Word;
  type: QuestionType;
  options?: string[]; // For multiple choice
  hint?: string; // For letter hint
  blankSentence?: string; // For fill blank
}

interface MixedResult {
  question: MixedQuestion;
  isCorrect: boolean;
  userAnswer: string;
}

type SessionState = 'loading' | 'active' | 'feedback' | 'done';

const MIXED_LIMIT = 20;

export default function MixedPracticePage() {
  const { words, loading } = useWords();
  const { playWord } = useTTS();

  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<MixedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<MixedResult[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [streak, setStreak] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate Questions
  const startSession = () => {
    const available = [...words].sort(() => Math.random() - 0.5);
    const selected = available.slice(0, Math.min(MIXED_LIMIT, available.length));

    const generated: MixedQuestion[] = selected.map((word) => {
      // Determine possible types for this word
      const possibleTypes: QuestionType[] = ['letter_hint', 'dictation', 'multiple_choice'];
      if (word.example && word.example.toLowerCase().includes(word.word.toLowerCase())) {
        possibleTypes.push('fill_blank');
      }

      // Randomly pick one type
      const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

      let options: string[] = [];
      let hint = '';
      let blankSentence = '';

      if (type === 'multiple_choice') {
        const wrongWords = [...words]
          .filter((w) => w.id !== word.id && w.meaning !== word.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        options = [word.meaning, ...wrongWords.map((w) => w.meaning)].sort(
          () => Math.random() - 0.5
        );
      } else if (type === 'letter_hint') {
        const chars = word.word.split('');
        const length = chars.length;
        if (length <= 2) {
          hint = '_ '.repeat(length).trim();
        } else {
          const showCount = Math.max(1, Math.floor(length * 0.3));
          const indicesToShow: number[] = [];
          while (indicesToShow.length < showCount) {
            const idx = Math.floor(Math.random() * length);
            if (!indicesToShow.includes(idx) && chars[idx] !== ' ') {
              indicesToShow.push(idx);
            }
          }
          hint = chars.map((c, i) => (indicesToShow.includes(i) || c === ' ' ? c : '_')).join(' ');
        }
      } else if (type === 'fill_blank' && word.example) {
        const regex = new RegExp(`\\b${word.word}\\b`, 'gi');
        blankSentence = word.example.replace(regex, '_________');
      }

      return { word, type, options, hint, blankSentence };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setResults([]);
    setUserAnswer('');
    setStreak(0);
    setState('active');
  };

  useEffect(() => {
    if (!loading && state === 'loading') {
      if (words.length < 4) {
        setTimeout(() => setState('done'), 0); // Hack to show empty state (handled below)
      } else {
        setTimeout(() => startSession(), 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, state]);

  // Focus input for typing modes
  useEffect(() => {
    if (state === 'active' && questions[currentIndex]) {
      const type = questions[currentIndex].type;
      if (type !== 'multiple_choice') {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
      
      // Auto-play dictation
      if (type === 'dictation') {
        setTimeout(() => playWord(questions[currentIndex].word.word), 300);
      }
    }
  }, [state, currentIndex, questions, playWord]);

  const handleAnswer = (answer: string) => {
    if (state !== 'active') return;
    
    const question = questions[currentIndex];
    setUserAnswer(answer);
    
    let isCorrect = false;
    if (question.type === 'multiple_choice') {
      isCorrect = answer === question.word.meaning;
    } else {
      isCorrect = answer.trim().toLowerCase() === question.word.word.toLowerCase();
    }

    setResults((prev) => [
      ...prev,
      { question, isCorrect, userAnswer: answer },
    ]);
    
    if (isCorrect) {
      setStreak((s) => s + 1);
      if (question.type !== 'dictation') {
        playWord(question.word.word);
      }
    } else {
      setStreak(0);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
    
    setState('feedback');
  };

  const nextQuestion = () => {
    if (state !== 'feedback') return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setState('active');
    } else {
      setState('done');
    }
  };

  // Auto-advance if correct
  useEffect(() => {
    if (state === 'feedback') {
      const lastResult = results[results.length - 1];
      if (lastResult?.isCorrect) {
        const timer = setTimeout(() => {
          nextQuestion();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, results]);

  // Keyboard shortcut: Enter = next question during feedback
  useEffect(() => {
    if (state !== 'feedback') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nextQuestion();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentIndex, questions.length]);

  // ========================
  // Empty & Loading State
  // ========================
  if (state === 'loading') {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="skeleton" style={{ width: '200px', height: '24px' }} />
      </div>
    );
  }

  if (state === 'done' && words.length < 4) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Link href="/practice" className="btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Thử thách hỗn hợp</h1>
        </div>

        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <Shuffle size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px' }}>
            Chưa đủ từ vựng
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Bạn cần ít nhất 4 từ vựng trong bộ sưu tập để luyện tập.
          </p>
          <Link href="/add-word" className="btn-primary" style={{ marginTop: '24px' }}>
            Thêm từ ngay
          </Link>
        </div>
      </div>
    );
  }

  // ========================
  // Done Screen
  // ========================
  if (state === 'done') {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100) || 0;

    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', paddingTop: '40px' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '👍' : '💪'}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Hoàn thành!
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '32px 0' }}>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--rating-good)', fontFamily: 'var(--font-mono)' }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chính xác</div>
            </div>
            <div className="stat-card" style={{ minWidth: '100px' }}>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {correctCount}/{results.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Câu đúng</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px' }}>
            <Link href="/practice" className="btn-secondary">
              Về danh sách
            </Link>
            <button onClick={startSession} className="btn-primary">
              <RotateCcw size={16} /> Làm lại
            </button>
          </div>

          {/* List of mistakes */}
          {results.filter(r => !r.isCorrect).length > 0 && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Các từ cần chú ý ôn lại:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.filter(r => !r.isCorrect).map((r, i) => (
                  <div key={i} className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.question.word.word}
                      </div>
                      <button onClick={() => playWord(r.question.word.word)} className="btn-icon" style={{ width: 28, height: 28 }}>
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--rating-good)', marginTop: '4px' }}>
                      Đáp án đúng: {r.question.type === 'multiple_choice' ? r.question.word.meaning : r.question.word.word}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--rating-forgot)', marginTop: '4px' }}>
                      Bạn đã chọn/gõ: {r.userAnswer || '(trống)'}
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

  // ========================
  // Active / Feedback Screen
  // ========================
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const progress = ((currentIndex + (state === 'feedback' ? 1 : 0)) / questions.length) * 100;
  const currentResult = results.find(r => r.question.word.id === currentQ.word.id);

  // Helper to render mode icon & title
  const getModeInfo = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice': return { icon: <ListOrdered size={16} />, title: 'Trắc nghiệm' };
      case 'fill_blank': return { icon: <Edit3 size={16} />, title: 'Điền vào chỗ trống' };
      case 'dictation': return { icon: <Headphones size={16} />, title: 'Nghe chính tả' };
      case 'letter_hint': return { icon: <Keyboard size={16} />, title: 'Điền từ theo gợi ý' };
    }
  };
  const modeInfo = getModeInfo(currentQ.type);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - var(--nav-height))' }}>
      
      {/* Header Area (Progress + Streak) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/practice" className="btn-icon" style={{ width: '32px', height: '32px' }}>
              <XCircle size={18} />
            </Link>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>
          
          <AnimatePresence>
            {streak > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--rating-hard)', fontWeight: 700, fontSize: '14px' }}
              >
                <Flame size={16} fill="var(--rating-hard)" />
                {streak} Combo!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ height: '100%', background: 'var(--accent)', borderRadius: 'var(--radius-full)' }}
          />
        </div>
      </div>

      {/* Mode Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          background: 'var(--bg-secondary)', padding: '6px 12px', 
          borderRadius: 'var(--radius-pill)', color: 'var(--text-secondary)',
          fontSize: '12px', fontWeight: 600, textTransform: 'uppercase'
        }}>
          {modeInfo.icon} {modeInfo.title}
        </div>
      </div>

      {/* Question Area */}
      <motion.div 
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ flex: 1 }}
          >
            {/* 1. TYPING MODES (Fill Blank, Letter Hint, Dictation) */}
            {currentQ.type !== 'multiple_choice' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '10px' }}>
                  {currentQ.type === 'fill_blank' && (
                    <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {currentQ.blankSentence}
                    </div>
                  )}
                  {currentQ.type === 'letter_hint' && (
                    <>
                      <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        {currentQ.word.meaning}
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '4px' }}>
                        {currentQ.hint}
                      </div>
                    </>
                  )}
                  {currentQ.type === 'dictation' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => playWord(currentQ.word.word)}
                        style={{
                          width: '64px', height: '64px', borderRadius: '50%',
                          background: 'var(--accent)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer',
                        }}
                      >
                        <Volume2 size={32} />
                      </motion.button>
                      <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                        Nghe và gõ lại từ bạn nghe được
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={state === 'feedback'}
                    placeholder="Gõ đáp án vào đây..."
                    className="input"
                    style={{
                      fontSize: '24px', padding: '16px', textAlign: 'center', fontWeight: 600,
                      borderColor: state === 'feedback' 
                        ? (currentResult?.isCorrect ? 'var(--rating-good)' : 'var(--rating-forgot)')
                        : 'var(--border)',
                      backgroundColor: state === 'feedback'
                        ? (currentResult?.isCorrect ? 'var(--rating-good-bg)' : 'var(--rating-forgot-bg)')
                        : 'var(--bg-primary)'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userAnswer.trim()) {
                        handleAnswer(userAnswer);
                      }
                    }}
                  />
                  
                  {state === 'active' && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleAnswer(userAnswer)}
                      disabled={!userAnswer.trim()}
                    >
                      Kiểm tra
                    </button>
                  )}

                  {state === 'feedback' && !currentResult?.isCorrect && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ textAlign: 'center', color: 'var(--rating-good)', fontWeight: 600, fontSize: '20px', marginTop: '16px' }}
                    >
                      Đáp án đúng: {currentQ.word.word}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* 2. MULTIPLE CHOICE UI */}
            {currentQ.type === 'multiple_choice' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '10px' }}>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentQ.word.word}
                  </div>
                  {currentQ.word.ipa && (
                    <div style={{ fontSize: '16px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {currentQ.word.ipa}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentQ.options?.map((opt, i) => {
                    const isSelected = userAnswer === opt;
                    const isCorrectOption = opt === currentQ.word.meaning;
                    
                    let bg = 'var(--bg-secondary)';
                    let border = 'var(--border)';
                    let color = 'var(--text-primary)';

                    if (state === 'feedback') {
                      if (isCorrectOption) {
                        bg = 'var(--rating-good-bg)';
                        border = 'var(--rating-good)';
                        color = 'var(--rating-good)';
                      } else if (isSelected) {
                        bg = 'var(--rating-forgot-bg)';
                        border = 'var(--rating-forgot)';
                        color = 'var(--rating-forgot)';
                      }
                    } else if (isSelected) {
                      bg = 'var(--accent-light)';
                      border = 'var(--accent)';
                    }

                    return (
                      <motion.button
                        whileHover={state === 'active' ? { scale: 1.01 } : {}}
                        whileTap={state === 'active' ? { scale: 0.99 } : {}}
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        disabled={state === 'feedback'}
                        style={{
                          padding: '12px 16px',
                          background: bg,
                          border: `2px solid ${border}`,
                          borderRadius: 'var(--radius-lg)',
                          color,
                          fontSize: '16px',
                          fontWeight: 500,
                          textAlign: 'left',
                          cursor: state === 'feedback' ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {opt}
                        {state === 'feedback' && isCorrectOption && <CheckCircle2 size={20} />}
                        {state === 'feedback' && isSelected && !isCorrectOption && <XCircle size={20} />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Next Button Container */}
      <div style={{ marginTop: '12px', minHeight: '48px', marginBottom: '12px' }}>
        <AnimatePresence>
          {state === 'feedback' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <button
                onClick={nextQuestion}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '16px' }}
              >
                Tiếp tục <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
