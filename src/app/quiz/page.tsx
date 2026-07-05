'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Target,
  ArrowRight,
  RotateCcw,
  Keyboard,
  ListOrdered,
  Headphones,
  Flame,
  Volume2,
} from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import { useTTS } from '@/hooks/use-tts';
import type { Word } from '@/types';

type QuizMode = 'multiple_choice' | 'typing' | 'listening';

interface QuizQuestion {
  word: Word;
  options: string[]; // only relevant for multiple_choice and listening
}

interface QuizResult {
  question: QuizQuestion;
  isCorrect: boolean;
  userAnswer: string;
}

type QuizState = 'loading' | 'select_mode' | 'active' | 'feedback' | 'done';

const QUIZ_LIMIT = 20;

function QuizContent() {
  const { words, loading } = useWords();
  const { playWord } = useTTS();
  const searchParams = useSearchParams();
  const queryMode = searchParams.get('mode') as QuizMode | null;

  const [state, setState] = useState<QuizState>('loading');
  const [mode, setMode] = useState<QuizMode>('multiple_choice');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  
  // Gamification states
  const [streak, setStreak] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);



  const startQuiz = (selectedMode: QuizMode) => {
    setMode(selectedMode);
    
    // Pick random words
    const available = [...words].sort(() => Math.random() - 0.5);
    const selected = available.slice(0, Math.min(QUIZ_LIMIT, available.length));

    // Generate questions
    const generated: QuizQuestion[] = selected.map((word) => {
      let options: string[] = [];
      if (selectedMode !== 'typing') {
        const wrongWords = [...words]
          .filter((w) => w.id !== word.id && w.meaning !== word.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        options = [word.meaning, ...wrongWords.map((w) => w.meaning)].sort(
          () => Math.random() - 0.5
        );
      }
      return { word, options };
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
      const timer = setTimeout(() => {
        if (queryMode && ['multiple_choice', 'typing', 'listening'].includes(queryMode)) {
          if (words.length >= 4) {
            startQuiz(queryMode);
          } else {
            setState('select_mode');
          }
        } else {
          setState('select_mode');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, state, queryMode]);

  // Auto-play TTS when starting a listening question
  useEffect(() => {
    if (state === 'active' && mode === 'listening' && questions[currentIndex]) {
      // Slight delay so the user is ready
      const timer = setTimeout(() => {
        playWord(questions[currentIndex].word.word);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state, currentIndex, mode, questions, playWord]);

  // Focus input for typing mode
  useEffect(() => {
    if (state === 'active' && mode === 'typing') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [state, currentIndex, mode]);

  const handleAnswer = (answer: string) => {
    if (state !== 'active') return;
    
    const question = questions[currentIndex];
    setUserAnswer(answer);
    
    let isCorrect = false;
    if (mode === 'typing') {
      isCorrect = answer.trim().toLowerCase() === question.word.word.toLowerCase();
    } else {
      isCorrect = answer === question.word.meaning;
    }

    setResults((prev) => [
      ...prev,
      { question, isCorrect, userAnswer: answer },
    ]);
    
    if (isCorrect) {
      setStreak((s) => s + 1);
      // Play TTS for reinforcement on correct answer (if not listening mode since they just heard it)
      if (mode !== 'listening') {
        playWord(question.word.word);
      }
    } else {
      setStreak(0);
      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
    
    setState('feedback');
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

  const nextQuestion = () => {
    // Prevent double-clicking or race conditions
    if (state !== 'feedback') return;
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setState('active');
    } else {
      setState('done');
    }
  };

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
  // Loading State
  // ========================
  if (state === 'loading') {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="skeleton" style={{ width: '200px', height: '24px' }} />
      </div>
    );
  }

  // ========================
  // Select Mode Screen
  // ========================
  if (state === 'select_mode') {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Link href="/" className="btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Kiểm tra
          </h1>
        </div>

        {words.length < 4 ? (
          <div className="empty-state" style={{ minHeight: '50vh' }}>
            <Target size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px' }}>
              Chưa đủ từ vựng
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Bạn cần ít nhất 4 từ vựng trong bộ sưu tập để có thể làm bài kiểm tra.
            </p>
            <Link href="/add-word" className="btn-primary" style={{ marginTop: '24px' }}>
              Thêm từ ngay
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Chọn chế độ kiểm tra mà bạn muốn luyện tập:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Trắc nghiệm */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startQuiz('multiple_choice')}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid var(--rating-easy)',
                  background: 'var(--rating-easy-bg)',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--rating-easy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ListOrdered size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Trắc nghiệm (Đọc hiểu)</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Đọc từ tiếng Anh, chọn nghĩa tiếng Việt</div>
                </div>
              </motion.button>

              {/* Gõ từ */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startQuiz('typing')}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid var(--rating-hard)',
                  background: 'var(--rating-hard-bg)',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--rating-hard)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Keyboard size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Gõ từ (Chính tả)</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nhìn nghĩa tiếng Việt, gõ lại từ tiếng Anh</div>
                </div>
              </motion.button>

              {/* Luyện nghe */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startQuiz('listening')}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid var(--accent)',
                  background: 'var(--accent-light)',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Headphones size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Luyện nghe (Nghe hiểu)</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nghe phát âm, chọn nghĩa tiếng Việt đúng</div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
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
            <button onClick={() => setState('select_mode')} className="btn-secondary">
              Đổi chế độ
            </button>
            <button onClick={() => startQuiz(mode)} className="btn-primary">
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
                      Đáp án đúng: {mode === 'typing' ? r.question.word.word : r.question.word.meaning}
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

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - var(--nav-height))' }}>
      
      {/* Header Area (Progress + Streak) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setState('select_mode')} className="btn-icon" style={{ width: '32px', height: '32px' }}>
              <XCircle size={18} />
            </button>
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

      {/* Question Area (Shake animated) */}
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
            {/* 1. TYPING MODE UI */}
            {mode === 'typing' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Gõ từ tiếng Anh
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'pre-wrap' }}>
                    {currentQ.word.meaning}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    ({currentQ.word.word.length} chữ cái)
                  </div>
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
                      fontSize: '24px',
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: 600,
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

            {/* 2. MULTIPLE CHOICE & LISTENING UI */}
            {mode !== 'typing' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                    {mode === 'listening' ? 'Nghe và chọn nghĩa' : 'Chọn nghĩa đúng'}
                  </div>
                  
                  {mode === 'multiple_choice' ? (
                    <>
                      <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {currentQ.word.word}
                      </div>
                      {currentQ.word.ipa && (
                        <div style={{ fontSize: '16px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {currentQ.word.ipa}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      {/* Listening Mode Play Button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => playWord(currentQ.word.word)}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          boxShadow: 'var(--shadow-md)',
                          cursor: 'pointer',
                        }}
                      >
                        <Volume2 size={40} />
                      </motion.button>
                      <div 
                        style={{ 
                          fontSize: '24px', 
                          fontWeight: 700, 
                          color: 'var(--text-primary)',
                          opacity: state === 'feedback' ? 1 : 0,
                          visibility: state === 'feedback' ? 'visible' : 'hidden',
                          minHeight: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'opacity 0.2s'
                        }}
                      >
                        {currentQ.word.word}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentQ.options.map((opt, i) => {
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
                          padding: '16px 20px',
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
      <div style={{ marginTop: '24px', minHeight: '56px', marginBottom: '24px' }}>
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
                style={{ width: '100%', padding: '16px', fontSize: '16px' }}
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

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="skeleton" style={{ width: '200px', height: '24px' }} />
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
