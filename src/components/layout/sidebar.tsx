'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  GraduationCap,
  Plus,
  Upload,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from './theme-provider';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/words', label: 'Từ vựng', icon: BookOpen },
  { href: '/learn', label: 'Học từ', icon: GraduationCap },
  { href: '/add-word', label: 'Thêm từ mới', icon: Plus },
  { href: '/import', label: 'Import Excel', icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hide-mobile"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--accent), #5856D6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Sparkles size={20} />
        </div>
        <div>
          <div
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            LexiFlow
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontWeight: 500,
            }}
          >
            TOEIC Vocabulary
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-pill)',
                  color: isActive
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                  background: isActive
                    ? 'var(--accent-light)'
                    : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <ThemeToggle />
      </div>
    </aside>
  );
}
