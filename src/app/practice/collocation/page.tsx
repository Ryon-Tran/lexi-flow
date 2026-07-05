'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useWords } from '@/hooks/use-words';
import type { Word } from '@/types';

type SessionState = 'loading' | 'empty' | 'active' | 'feedback' | 'done';

interface CollocationQuestion {
  word: Word;
  phraseText: string; // e.g. "produce goods"
  questionText: string; // e.g. "produce ______" or "______ goods"
  correctAnswer: string; // e.g. "goods" or "produce"
  options: string[]; // 4 options
  type: 'target' | 'collocate';
}

export default function CollocationPage() {
  const { words, loading } = useWords();
  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<CollocationQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<{ question: CollocationQuestion; isCorrect: boolean; userAnswer: string }[]>([]);
  const [streak, setStreak] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!loading) {
      const allQuestions: CollocationQuestion[] = [];
      const wordsWithPhrases = words.filter(w => w.phrase && w.phrase.trim() !== '');

      // Build questions from phrases
      wordsWithPhrases.forEach(w => {
        const rawPhrases = w.phrase!.split(/[\n,;]/).map(p => p.trim()).filter(p => p.length > 0);
        
        rawPhrases.forEach(phraseText => {
          const lowerPhrase = phraseText.toLowerCase();
          const lowerWord = w.word.toLowerCase();

          if (lowerPhrase.includes(lowerWord)) {
            // We can make two types of questions:
            // 1. Target word is blanked: "______ goods" -> answer: "produce"
            // 2. Collocate word is blanked: "produce ______" -> answer: "goods"
            
            // Type 1: Blank the target word
            const rxWord = new RegExp(`\\b${w.word}\\b`, 'i');
            const blankedTarget = phraseText.replace(rxWord, '______');
            
            // Extract the collocate word(s)
            const collocatePart = phraseText.replace(rxWord, '').trim();

            if (blankedTarget !== phraseText && collocatePart.length > 0) {
              allQuestions.push({
                word: w,
                phraseText,
                questionText: blankedTarget,
                correctAnswer: w.word,
                options: [], // will fill later
                type: 'target'
              });

            // Type 2: Blank the collocate
            // Find where the target word is and blank the rest
            const collocateAnswer = collocatePart;
            
            allQuestions.push({
              word: w,
              phraseText,
              questionText: phraseText.replace(new RegExp(`\\b${collocateAnswer}\\b`, 'i'), '______'),
              correctAnswer: collocateAnswer,
              options: [], // will fill later
              type: 'collocate'
            });
            }
          }
        });
      });

      if (allQuestions.length === 0) {
        setTimeout(() => setState('empty'), 0);
      } else {
        // Shuffle and limit to 15 questions
        const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 15);

        // Generate options for each question
        const finalized = shuffled.map(q => {
          const options = new Set<string>();
          options.add(q.correctAnswer);

          // Get distractor options
          if (q.type === 'target') {
            // Distractors are other English words
            const otherWords = words
              .filter(w => w.word.toLowerCase() !== q.correctAnswer.toLowerCase())
              .map(w => w.word);
            
            const shuffledOthers = otherWords.sort(() => Math.random() - 0.5);
            shuffledOthers.slice(0, 3).forEach(o => options.add(o));
          } else {
            // Distractors are other collocate parts or meanings
            const otherCollocates = allQuestions
              .filter(o => o.type === 'collocate' && o.correctAnswer.toLowerCase() !== q.correctAnswer.toLowerCase())
              .map(o => o.correctAnswer);
            
            const shuffledOthers = otherCollocates.sort(() => Math.random() - 0.5);
            shuffledOthers.slice(0, 3).forEach(o => options.add(o));
          }

          // Fallback distractor generation if not enough options
          while (options.size < 4) {
            const fallback = words[Math.floor(Math.random() * words.length)]?.word;
            if (fallback && fallback.toLowerCase() !== q.correctAnswer.toLowerCase()) {
              options.add(fallback);
            } else {
              options.add('item ' + options.size);
            }
          }

          return {
            ...q,
            options: Array.from(options).sort(() => Math.random() - 0.5)
          };
        });

        setTimeout(() => {
          setQuestions(finalized);
          setState('active');
          setCurrentIndex(0);
          setSelectedAnswer(null);
          setResults([]);
          setStreak(0);
        }, 0);
      }
    }
  }, [words, loading]);

  const handleAnswer = (answer: string) => {
    if (state !== 'active') return;

    const currentQ = questions[currentIndex];
    setSelectedAnswer(answer);

    const isCorrect = answer.toLowerCase() === currentQ.correctAnswer.toLowerCase();

    setResults(prev => [
      ...prev,
      { question: currentQ, isCorrect, userAnswer: answer }
    ]);

    if (isCorrect) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    setState('feedback');
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setState('active');
    } else {
      setState('done');
    }
  };

  const resetSession = () => {
    setState('loading');
    // Start round again from initial words
    const allQuestions: CollocationQuestion[] = [];
    const wordsWithPhrases = words.filter(w => w.phrase && w.phrase.trim() !== '');

    wordsWithPhrases.forEach(w => {
      const rawPhrases = w.phrase!.split(/[\n,;]/).map(p => p.trim()).filter(p => p.length > 0);
      rawPhrases.forEach(phraseText => {
        const lowerPhrase = phraseText.toLowerCase();
        const lowerWord = w.word.toLowerCase();
        if (lowerPhrase.includes(lowerWord)) {
          const rxWord = new RegExp(`\\b${w.word}\\b`, 'i');
          const blankedTarget = phraseText.replace(rxWord, '______');
          const collocatePart = phraseText.replace(rxWord, '').trim();

          if (blankedTarget !== phraseText && collocatePart.length > 0) {
            allQuestions.push({
              word: w,
              phraseText,
              questionText: blankedTarget,
              correctAnswer: w.word,
              options: [],
              type: 'target'
            });

            const collocateAnswer = collocatePart;
            allQuestions.push({
              word: w,
              phraseText,
              questionText: phraseText.replace(new RegExp(`\\b${collocateAnswer}\\b`, 'i'), '______'),
              correctAnswer: collocateAnswer,
              options: [],
              type: 'collocate'
            });
          }
        }
      });
    });

    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 15);
    const finalized = shuffled.map(q => {
      const options = new Set<string>();
      options.add(q.correctAnswer);
      if (q.type === 'target') {
        const otherWords = words.filter(w => w.word.toLowerCase() !== q.correctAnswer.toLowerCase()).map(w => w.word);
        otherWords.sort(() => Math.random() - 0.5).slice(0, 3).forEach(o => options.add(o));
      } else {
        const otherCollocates = allQuestions.filter(o => o.type === 'collocate' && o.correctAnswer.toLowerCase() !== q.correctAnswer.toLowerCase()).map(o => o.correctAnswer);
        otherCollocates.sort(() => Math.random() - 0.5).slice(0, 3).forEach(o => options.add(o));
      }
      while (options.size < 4) {
        const fallback = words[Math.floor(Math.random() * words.length)]?.word;
        if (fallback && fallback.toLowerCase() !== q.correctAnswer.toLowerCase()) options.add(fallback);
        else options.add('item ' + options.size);
      }
      return { ...q, options: Array.from(options).sort(() => Math.random() - 0.5) };
    });

    setQuestions(finalized);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setStreak(0);
    setState('active');
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
          <h1 className="page-title" style={{ marginBottom: 0 }}>Học cụm từ</h1>
        </div>

        <div className="empty-state" style={{ minHeight: '50vh' }}>
          <HelpCircle size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '16px', color: 'var(--text-primary)' }}>Không tìm thấy cụm từ</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '8px' }}>
            Chế độ này yêu cầu các từ vựng phải có trường <strong>Cụm từ (Phrase)</strong> và cụm từ đó phải chứa chính từ vựng đó. Vui lòng thêm cụm từ để rèn luyện.
          </p>
          <Link href="/add-word" className="btn-primary" style={{ marginTop: '24px' }}>
            Thêm cụm từ mới
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Hoàn thành!
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Bạn đã ôn tập xong {results.length} câu ghép cụm từ.
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
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Câu đúng</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <Link href="/practice" className="btn-secondary">
              Về danh sách
            </Link>
            <button onClick={resetSession} className="btn-primary">
              <RotateCcw size={16} /> Luyện tập tiếp
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const progress = ((currentIndex + (state === 'feedback' ? 1 : 0)) / questions.length) * 100;

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
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'var(--accent)', borderRadius: 'var(--radius-full)' }}
          />
        </div>
      </div>

      {/* Question Content */}
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div className="glass-card" style={{ padding: '32px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="badge badge-outline" style={{ marginBottom: '12px' }}>
              TOEIC Collocation
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontStyle: 'italic' }}>
              &ldquo;{currentQ.questionText}&rdquo;
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Nghĩa của từ gốc ({currentQ.word.word}): <strong>{currentQ.word.meaning}</strong>
            </div>
          </div>

          {/* Options Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px', margin: '0 auto' }}>
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOption = opt.toLowerCase() === currentQ.correctAnswer.toLowerCase();
              
              let bg = 'var(--bg-secondary)';
              let border = '2px solid var(--border)';
              let color = 'var(--text-primary)';

              if (state === 'feedback') {
                if (isCorrectOption) {
                  bg = 'var(--rating-good-bg)';
                  border = '2px solid var(--rating-good)';
                  color = 'var(--rating-good)';
                } else if (isSelected) {
                  bg = 'var(--rating-forgot-bg)';
                  border = '2px solid var(--rating-forgot)';
                  color = 'var(--rating-forgot)';
                }
              } else if (isSelected) {
                bg = 'var(--accent-light)';
                border = '2px solid var(--accent)';
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
                    border,
                    borderRadius: 'var(--radius-lg)',
                    color,
                    fontSize: '16px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: state === 'feedback' ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {opt}
                  {state === 'feedback' && isCorrectOption && <CheckCircle2 size={18} />}
                  {state === 'feedback' && isSelected && !isCorrectOption && <XCircle size={18} />}
                </motion.button>
              );
            })}
          </div>

          {/* Next Button */}
          {state === 'feedback' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}
            >
              <button
                onClick={handleNext}
                className="btn-primary"
                style={{ width: '100%', maxWidth: '420px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Tiếp tục <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
