'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FiBookOpen, FiHome, FiMessageCircle, FiLogIn, FiGrid, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';

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
      className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
      style={{
        background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.12)',
        border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.3)'}`,
        color: isDark ? '#818cf8' : '#f59e0b',
      }}
      title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}>
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
    </button>
  );
}

export default function Navbar() {
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

  // ===== Desktop Navbar =====
  const DesktopNav = () => (
    <nav className="fixed top-0 w-full z-50 hidden md:flex"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        height: '64px',
      }}>
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-9 h-9 rounded-xl object-cover" />
            : <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <FiBookOpen className="text-white text-lg" />
              </div>}
          <span className="font-bold text-base"
            style={{
              background: 'linear-gradient(135deg, #818cf8, #f472b6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
            {settings?.site_name || 'منصة الأستاذ'}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}>
            <FiHome size={15} /> الرئيسية
          </Link>
          {settings?.whatsapp_number && (
            <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}>
              <FiMessageCircle size={15} /> تواصل
            </a>
          )}
          {userType === 'admin' && (
            <Link href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <FiGrid size={15} /> لوحة التحكم
            </Link>
          )}
          {userType === 'student' && (
            <>
              <Link href="/student"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <FiBookOpen size={15} /> كورساتي
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition hover:opacity-80"
                style={{ color: '#f87171' }}>
                <FiLogOut size={15} /> خروج
              </button>
            </>
          )}
          {!userType && (
            <Link href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <FiLogIn size={15} /> دخول
            </Link>
          )}
        </div>
      </div>
    </nav>
  );

  // ===== Mobile Bottom Bar =====
  const MobileBottomBar = () => {
    const items = userType === 'admin'
      ? [
          { href: '/', icon: <FiHome size={20} />, label: 'الرئيسية' },
          { href: '/dashboard', icon: <FiGrid size={20} />, label: 'التحكم' },
          { href: settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : '#', icon: <FiMessageCircle size={20} />, label: 'تواصل', external: true },
        ]
      : userType === 'student'
      ? [
          { href: '/', icon: <FiHome size={20} />, label: 'الرئيسية' },
          { href: '/student', icon: <FiBookOpen size={20} />, label: 'كورساتي' },
          { href: settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : '#', icon: <FiMessageCircle size={20} />, label: 'تواصل', external: true },
        ]
      : [
          { href: '/', icon: <FiHome size={20} />, label: 'الرئيسية' },
          { href: '/login', icon: <FiLogIn size={20} />, label: 'دخول' },
          { href: settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : '#', icon: <FiMessageCircle size={20} />, label: 'تواصل', external: true },
        ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex items-center justify-around px-4 py-2">
          {items.map((item, i) => (
            item.external
              ? <a key={i} href={item.href} target="_blank"
                  className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition"
                  style={{ color: 'var(--text-muted)' }}>
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </a>
              : <Link key={i} href={item.href}
                  className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition"
                  style={{ color: 'var(--text-muted)' }}>
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Link>
          ))}
          {/* Theme Toggle */}
          <button onClick={() => {
            const root = document.documentElement;
            const isDark = root.classList.contains('dark');
            root.classList.toggle('dark', !isDark);
            root.classList.toggle('light', isDark);
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
          }}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition"
            style={{ color: 'var(--text-muted)' }}>
            <FiSun size={20} className="dark-only" />
            <FiMoon size={20} className="light-only" />
            <span className="text-xs">المظهر</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <DesktopNav />
      <MobileBottomBar />
    </>
  );
}
