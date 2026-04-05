'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false); // لمنع الـ Hydration error

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    
    setIsDark(dark);
    updateTheme(dark);
  }, []);

  const updateTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    updateTheme(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // لو لسه المكون محملش على الـ Client، بنرجع مكان فاضي عشان الـ Layout ميتغيرش فجأة
  if (!mounted) return <div className="w-12 h-6" />;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle Theme"
      className="group relative w-14 h-7 rounded-full transition-all duration-500 glass hover:border-primary/50"
      style={{
        background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
        border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.3)'}`,
      }}
    >
      {/* الدائرة المتحركة */}
      <div
        className={`absolute top-0.5 w-5.5 h-5.5 rounded-full transition-all duration-500 ease-in-out flex items-center justify-center shadow-lg transform
          ${isDark ? 'translate-x-[-4px] rotate-0' : 'translate-x-[-28px] rotate-[360deg]'}
        `}
        style={{
          right: '4px',
          background: isDark 
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
            : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          boxShadow: isDark 
            ? '0 0 15px rgba(99,102,241,0.4)' 
            : '0 0 15px rgba(245,158,11,0.4)',
        }}
      >
        <span className="text-[10px] select-none">
          {isDark ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
}
