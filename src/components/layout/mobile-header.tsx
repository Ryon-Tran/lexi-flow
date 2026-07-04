'use client';

import { Sparkles } from 'lucide-react';
import { ThemeToggle } from './theme-provider';

export function MobileHeader() {
  return (
    <header
      className="hide-desktop"
      style={{
        position: 'sticky',
        top: 0,
        height: 'var(--nav-height)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 99,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent), #5856D6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Sparkles size={15} />
        </div>
        <span
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
          }}
        >
          LexiFlow
        </span>
      </div>
      <ThemeToggle />
    </header>
  );
}
