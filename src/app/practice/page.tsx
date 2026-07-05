'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Layers, Edit3, Grid, Award, Headphones, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { LEARNING_MODES } from '@/lib/learning-config';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function PracticeHubPage() {
  const activeModes = LEARNING_MODES.filter((mode) => mode.enabled);

  // Map icons to learning mode IDs
  const getIcon = (id: string) => {
    switch (id) {
      case 'flashcard':
        return <Layers size={22} />;
      case 'fill_blank':
        return <Edit3 size={22} />;
      case 'matching':
        return <Grid size={22} />;
      case 'collocation':
        return <Award size={22} />;
      case 'dictation':
        return <Headphones size={22} />;
      case 'letter_hint':
        return <HelpCircle size={22} />;
      default:
        return <BookOpen size={22} />;
    }
  };

  const getDifficultyColor = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return 'var(--rating-easy)';
      case 'medium':
        return 'var(--accent)';
      case 'hard':
        return 'var(--rating-forgot)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getDifficultyLabel = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return 'Dễ';
      case 'medium':
        return 'Trung bình';
      case 'hard':
        return 'Khó';
      default:
        return 'Mọi cấp độ';
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Link href="/" className="btn-icon">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title" style={{ marginBottom: '2px' }}>
            Luyện tập chuyên sâu
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Chọn phương pháp học phù hợp để rèn luyện ghi nhớ từ vựng TOEIC
          </p>
        </div>
      </div>

      {/* Grid of modes */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px',
        }}
      >
        {activeModes.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} style={{ opacity: 0.5 }} />
            <h3>Không có chế độ học nào hoạt động</h3>
            <p>Vui lòng kiểm tra lại tệp cấu hình `learning-config.ts` của bạn.</p>
          </div>
        ) : (
          activeModes.map((mode) => (
            <motion.div key={mode.id} variants={item}>
              <Link href={mode.path} style={{ textDecoration: 'none' }}>
                <div
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left Icon Plate */}
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-xl)',
                      background: mode.difficulty === 'easy' 
                        ? 'var(--rating-easy-bg)'
                        : mode.difficulty === 'medium'
                        ? 'var(--accent-light)'
                        : 'var(--rating-forgot-bg)',
                      color: getDifficultyColor(mode.difficulty),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getIcon(mode.id)}
                  </div>

                  {/* Main Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '4px',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '17px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {mode.vietnameseName}
                      </h3>
                      <span
                        className="badge badge-outline"
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          color: getDifficultyColor(mode.difficulty),
                          borderColor: getDifficultyColor(mode.difficulty),
                        }}
                      >
                        {getDifficultyLabel(mode.difficulty)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {mode.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
