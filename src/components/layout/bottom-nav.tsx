'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, GraduationCap, Plus } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/words', label: 'Từ vựng', icon: BookOpen },
  { href: '/practice', label: 'Học tập', icon: GraduationCap },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hide-desktop"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: '8px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 100,
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
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 16px',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              textDecoration: 'none',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 500,
              transition: 'color 0.2s ease',
              position: 'relative',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-pill)',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
