'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Upload,
  Flame,
  CheckCircle2,
  Clock,
  Library,
  Target,
} from 'lucide-react';
import { useReviews } from '@/hooks/use-reviews';
import type { DashboardStats } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function DashboardPage() {
  const { getStats } = useReviews();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {
        // If Supabase is not configured, show demo data
        setStats({
          totalWords: 0,
          memorized: 0,
          dueToday: 0,
          streak: 0,
          newWords: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [getStats]);

  return (
    <div className="page-container">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">Xin chào! 👋</h1>
        <p className="page-subtitle">
          {stats && stats.dueToday > 0
            ? `Bạn có ${stats.dueToday} từ cần ôn hôm nay`
            : 'Hãy bắt đầu thêm từ vựng mới'}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <motion.div variants={item} className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Library size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
            }}
          >
            {loading ? '—' : stats?.totalWords || 0}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Tổng số từ
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--rating-good-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--rating-good)',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
            }}
          >
            {loading ? '—' : stats?.memorized || 0}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Đã nhớ
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--rating-hard-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--rating-hard)',
              }}
            >
              <Clock size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
            }}
          >
            {loading ? '—' : stats?.dueToday || 0}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Cần ôn hôm nay
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--rating-forgot-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--rating-forgot)',
              }}
            >
              <Flame size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
            }}
          >
            {loading ? '—' : stats?.streak || 0}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Ngày liên tiếp
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}
        >
          Hành động nhanh
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {stats && stats.dueToday > 0 && (
            <Link href="/learn" style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    Bắt đầu ôn tập
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      opacity: 0.8,
                    }}
                  >
                    {stats.dueToday} từ đang chờ
                  </div>
                </div>
              </motion.div>
            </Link>
          )}

          <Link href="/add-word" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--rating-good-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--rating-good)',
                }}
              >
                <Plus size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Thêm từ mới
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Nhập từ vựng thủ công
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/quiz" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--rating-easy-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--rating-easy)',
                }}
              >
                <Target size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Kiểm tra (Quiz)
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Làm bài test đánh giá trí nhớ
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/import" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <Upload size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Import Excel
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Nhập hàng loạt từ file .xlsx
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/words" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--rating-hard-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--rating-hard)',
                }}
              >
                <BookOpen size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Danh sách từ
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Xem và quản lý từ vựng
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
