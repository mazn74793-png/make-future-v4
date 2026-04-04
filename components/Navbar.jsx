'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FiMenu, FiX, FiBookOpen, FiLogIn, FiHome, FiMessageCircle } from 'react-icons/fi';

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
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
    <button onClick={toggle}
      className="relative w-12 h-6 rounded-full flex-shrink-0"
      style={{
        background: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(245,158,11,0.15)',
        border: `1px solid ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(245,158,11,0.4)'}`,
        transition: 'all 0.3s ease',
      }}
      title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
    >
      <div className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs"
        style={{
          right: isDark ? '2px' : 'auto',
          left: isDark ? 'auto' : '2px',
          background: isDark ? '#6366f1' : '#f59e0b',
          transition: 'all 0.3s ease',
          boxShadow: isDark ? '0 0 8px rgba(99,102,241,0.5)' : '0 0 8px rgba(245,158,11,0.5)',
        }}>
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('site_settings').select('*').single();
      if (data) setSettings(data);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single();
      if (admin) { setUserType('admin'); return; }

      const { data: student } = await supabase.from('students').select('status').eq('user_id', user.id).single();
      if (student?.status === 'approved') setUserType('student');
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
                <FiBookOpen className="text-white text-lg" />
              </div>
            )}
            <span className="text-base font-bold hidden sm:block"
              style={{ background: 'linear-gradient(135deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {settings?.site_name || 'منصة الأستاذ'}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/" className="text-sm hover:opacity-80 transition flex items-center gap-1"
              style={{ color: 'var(--text-muted)' }}>
              <FiHome className="text-base" /> الرئيسية
            </Link>
            {settings?.whatsapp_number && (
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                className="text-sm transition flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}>
                <FiMessageCircle className="text-base" /> تواصل
              </a>
            )}
            {userType === 'admin' && (
              <Link href="/dashboard"
                className="gradient-primary px-5 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition">
                لوحة التحكم
              </Link>
            )}
            {userType === 'student' && (
              <>
                <Link href="/student"
                  className="gradient-primary px-5 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition">
                  كورساتي
                </Link>
                <button onClick={handleLogout}
                  className="text-sm transition px-3 py-2 rounded-xl"
                  style={{ color: '#f87171' }}>
                  خروج
                </button>
              </>
            )}
            {!userType && (
              <Link href="/login"
                className="gradient-primary px-5 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition flex items-center gap-1">
                <FiLogIn /> دخول
              </Link>
            )}
          </div>

          {/* Mobile: theme + menu */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button onClick={() => setIsOpen(!isOpen)}
              className="text-xl p-1" style={{ color: 'var(--text)' }}>
              {isOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 pt-2 animate-fade-in border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition"
                style={{ color: 'var(--text-muted)' }}>
                🏠 الرئيسية
              </Link>
              {settings?.whatsapp_number && (
                <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ color: 'var(--text-muted)' }}>
                  💬 تواصل
                </a>
              )}
              {userType === 'admin' && (
                <Link href="/dashboard" onClick={() => setIsOpen(false)}
                  className="gradient-primary text-center px-6 py-3 rounded-xl text-white font-bold">
                  🎛️ لوحة التحكم
                </Link>
              )}
              {userType === 'student' && (
                <>
                  <Link href="/student" onClick={() => setIsOpen(false)}
                    className="gradient-primary text-center px-6 py-3 rounded-xl text-white font-bold">
                    📚 كورساتي
                  </Link>
                  <button onClick={handleLogout}
                    className="text-center py-2 rounded-xl font-bold"
                    style={{ color: '#f87171' }}>
                    🚪 خروج
                  </button>
                </>
              )}
              {!userType && (
                <Link href="/login" onClick={() => setIsOpen(false)}
                  className="gradient-primary text-center px-6 py-3 rounded-xl text-white font-bold">
                  🔐 دخول
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
