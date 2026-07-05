'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import type { Word } from '@/types';

type SessionState = 'loading' | 'empty' | 'active' | 'feedback' | 'done';

interface Question {
  word: Word;
  blankedSentence: string;
  originalWordInSentence: string;
  acceptedAnswers: string[];
}

export default function FillBlankPage() {
  const { words, loading } = useWords();
  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<{ question: Question; isCorrect: boolean; userAnswer: string }[]>([]);
  const [streak, setStreak] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isShaking, setIsShaking] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to extract inflections and mask target word in example sentence
  const generateQuestion = (word: Word): Question | null => {
    if (!word.example) return null;

    const baseWord = word.word.trim();
    const example = word.example.trim();
    
    // Algorithm to find the target word or its inflections in the sentence
    const w = baseWord.toLowerCase();
    const cleanExample = example.toLowerCase();
    
    let regex = new RegExp(`\\b${w}\\b`, 'i');
    let match = example.match(regex);
    
    // Fallback 1: match stem (e.g. "produce" -> "produc")
    if (!match) {
      const stem = w.length > 4 ? w.slice(0, -1) : w;
      regex = new RegExp(`\\b${stem}[a-z]{0,4}\\b`, 'i');
      match = example.match(regex);
    }
    
    // Fallback 2: match "y" endings (e.g. "apply" -> "applied", "applies")
    if (!match && w.endsWith('y')) {
      const stem = w.slice(0, -1);
      regex = new RegExp(`\\b${stem}(ies|ied|ying)\\b`, 'i');
      match = example.match(regex);
    }
    
    // Fallback 3: generic substring match
    let blankedSentence = '';
    let originalWordInSentence = baseWord;
    
    if (match) {
      originalWordInSentence = match[0];
      blankedSentence = example.replace(regex, '______');
    } else {
      const index = cleanExample.indexOf(w);
      if (index !== -1) {
        originalWordInSentence = example.substring(index, index + baseWord.length);
        blankedSentence = example.substring(0, index) + '______' + example.substring(index + baseWord.length);
      } else {
        // Ultimate fallback
        blankedSentence = example.replace(new RegExp(baseWord, 'gi'), '______');
      }
    }

    // Generate dynamic list of accepted answers (base + common inflections)
    const answers = new Set<string>();
    answers.add(baseWord.toLowerCase());
    answers.add(originalWordInSentence.toLowerCase());
    
    // Add standard inflections
    answers.add(w + 's');
    answers.add(w + 'es');
    answers.add(w + 'ed');
    answers.add(w + 'd');
    answers.add(w + 'ing');
    
    if (w.endsWith('e')) {
      answers.add(w.slice(0, -1) + 'ing');
      answers.add(w + 'd');
    }
    
    if (w.endsWith('y')) {
      const stem = w.slice(0, -1);
      answers.add(stem + 'ies');
      answers.add(stem + 'ied');
      answers.add(stem + 'ying');
    }
    
    // Double consonant rule
    if (w.length > 2 && !'aeiou'.includes(w[w.length - 1]) && 'aeiou'.includes(w[w.length - 2]) && !'aeiou'.includes(w[w.length - 3])) {
      const lastChar = w[w.length - 1];
      answers.add(w + lastChar + 'ing');
      answers.add(w + lastChar + 'ed');
    }

    return {
      word,
      blankedSentence,
      originalWordInSentence,
      acceptedAnswers: Array.from(answers),
    };
  };

  useEffect(() => {
    if (!loading) {
      const wordsWithExamples = words.filter(w => w.example && w.example.trim() !== '');
      if (wordsWithExamples.length === 0) {
        setTimeout(() => setState('empty'), 0);
      } else {
        // Pick up to 15 random questions
        const shuffled = [...wordsWithExamples].sort(() => Math.random() - 0.5);
        const generated = shuffled
          .map(w => generateQuestion(w))
          .filter((q): q is Question => q !== null)
          .slice(0, 15);
        
        if (generated.length === 0) {
          setTimeout(() => setState('empty'), 0);
        } else {
          setTimeout(() => {
            setQuestions(generated);
            setState('active');
            setStartTime(Date.now());
            setCurrentIndex(0);
            setResults([]);
            setStreak(0);
          }, 0);
        }
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

  // Auto focus input
  useEffect(() => {
    if (state === 'active') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [state, currentIndex]);

  const currentQ = questions[currentIndex];

  const handleCheck = useCallback(() => {
    if (state !== 'active' || !userAnswer.trim() || !currentQ) return;

    const cleanAnswer = userAnswer.trim().toLowerCase();
    
    // Check if user answer matches base form or any of the inflected forms
    const isCorrect = currentQ.acceptedAnswers.includes(cleanAnswer);
    
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
    const wordsWithExamples = words.filter(w => w.example && w.example.trim() !== '');
    if (wordsWithExamples.length === 0) {
      setState('empty');
      return;
    }
    const shuffled = [...wordsWithExamples].sort(() => Math.random() - 0.5);
    const generated = shuffled
      .map(w => generateQuestion(w))
      .filter((q): q is Question => q !== null)
      .slice(0, 15);

    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswer('');
    setResults([]);
    setStreak(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setState('active');
  };

  // Keyboard shortcut: Enter to submit or next
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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
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
          <h1 className="page-title" style={{ marginBottom: 0 }}>Điền vào chỗ trống</h1>
        </div>

        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <HelpCircle size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '16px', color: 'var(--text-primary)' }}>Không tìm thấy ví dụ</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '8px' }}>
            Chế độ này yêu cầu các từ vựng phải có trường <strong>Ví dụ (Example)</strong>. Vui lòng thêm câu ví dụ cho các từ vựng của bạn để bắt đầu học.
          </p>
          <Link href="/add-word" className="btn-primary" style={{ marginTop: '24px' }}>
            Thêm từ và ví dụ
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Hoàn thành!
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Bạn đã làm xong {results.length} câu điền từ
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '32px 0' }}>
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
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Đúng</div>
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
            <button onClick={resetSession} className="btn-primary">
              <RotateCcw size={16} /> Luyện tập tiếp
            </button>
          </div>

          {/* Mistakes list */}
          {results.filter(r => !r.isCorrect).length > 0 && (
            <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Các từ đã điền sai:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.filter(r => !r.isCorrect).map((r, i) => (
                  <div key={i} className="glass-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.question.word.word} ({r.question.word.pos})
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {r.question.word.meaning}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: '8px 0' }}>
                      &ldquo;{r.question.blankedSentence.replace('______', `[${r.question.originalWordInSentence}]`)}&rdquo;
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--rating-good)' }}>
                        Đáp án đúng: {r.question.originalWordInSentence} {r.question.word.word !== r.question.originalWordInSentence && `(hoặc ${r.question.word.word})`}
                      </span>
                      <span style={{ color: 'var(--rating-forgot)' }}>
                        Bạn nhập: {r.userAnswer || '(trống)'}
                      </span>
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

  if (!currentQ) return null;

  const progress = ((currentIndex + (state === 'feedback' ? 1 : 0)) / questions.length) * 100;
  const currentResult = results.find(r => r.question.word.id === currentQ.word.id);

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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              ⏱️ {formatTime(elapsedTime)}
            </span>
            {streak > 1 && (
              <span style={{ color: 'var(--rating-hard)', fontWeight: 700, fontSize: '14px' }}>
                🔥 {streak} Combo
              </span>
            )}
          </div>
        </div>
        
        <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'var(--accent)', borderRadius: 'var(--radius-full)' }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div className="glass-card" style={{ padding: '32px 24px', position: 'relative' }}>
          
          {/* Question context */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-outline" style={{ textTransform: 'uppercase' }}>
                {currentQ.word.pos}
              </span>
              {currentQ.word.ipa && (
                <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  {currentQ.word.ipa}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {currentQ.word.meaning}
            </h3>
          </div>

          {/* Sentence Blank */}
          <div 
            style={{ 
              fontSize: '20px', 
              color: 'var(--text-primary)', 
              lineHeight: 1.6, 
              textAlign: 'center', 
              marginBottom: '32px',
              fontStyle: 'italic',
              fontWeight: 500,
              padding: '0 12px'
            }}
          >
            {/* Split blanked sentence to emphasize the blank space */}
            {(() => {
              const parts = currentQ.blankedSentence.split('______');
              return (
                <span>
                  {parts[0]}
                  <span 
                    style={{ 
                      borderBottom: `2px solid ${state === 'feedback' ? (currentResult?.isCorrect ? 'var(--rating-good)' : 'var(--rating-forgot)') : 'var(--accent)'}`,
                      color: state === 'feedback' ? (currentResult?.isCorrect ? 'var(--rating-good)' : 'var(--rating-forgot)') : 'var(--accent)',
                      padding: '0 8px',
                      fontStyle: 'normal',
                      fontWeight: 700
                    }}
                  >
                    {state === 'feedback' ? currentQ.originalWordInSentence : '______'}
                  </span>
                  {parts[1]}
                </span>
              );
            })()}
          </div>

          {/* Input control */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Gõ từ phù hợp..."
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              disabled={state === 'feedback'}
              style={{
                fontSize: '18px',
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

          {/* Detailed word hint under explanation */}
          {state === 'feedback' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {currentQ.word.phrase && (
                <div style={{ fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cụm từ hay gặp: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{currentQ.word.phrase}</span>
                </div>
              )}
              {currentQ.word.note && (
                <div style={{ fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Ghi chú: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{currentQ.word.note}</span>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
