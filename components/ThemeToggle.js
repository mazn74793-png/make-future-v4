'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // قرأ الـ preference المحفوظة
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
      style={{
        background: isDark
          ? 'rgba(99,102,241,0.3)'
          : 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.4)',
      }}
      title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-xs"
        style={{
          right: isDark ? '2px' : 'auto',
          left: isDark ? 'auto' : '2px',
          background: isDark ? '#6366f1' : '#f59e0b',
          boxShadow: isDark
            ? '0 0 8px rgba(99,102,241,0.6)'
            : '0 0 8px rgba(245,158,11,0.6)',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
}
