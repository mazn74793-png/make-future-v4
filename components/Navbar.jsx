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

  // ===== هيدر الموبايل العلوي (لإصلاح التداخل في صورك) =====
  const MobileTopHeader = () => (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 md:hidden border-b"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'var(--border)'
      }}>
      <Link href="/" className="flex items-center gap-2">
        {settings?.logo_url
          ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          : <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600">
              <FiBookOpen className="text-white text-sm" />
            </div>}
        <div className="flex flex-col">
           <span className="font-bold text-xs leading-none" style={{ color: 'var(--text)' }}>
             {settings?.site_name || 'المنصة التعليمية'}
           </span>
           <span className="text-[10px] opacity-60 mt-1" style={{ color: 'var(--text-muted)' }}>
             {settings?.teacher_name || ''}
           </span>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {userType && (
           <button onClick={handleLogout} className="p-2 text-red-500"><FiLogOut size={18} /></button>
        )}
      </div>
    </div>
  );

  // ===== Desktop Navbar =====
  const DesktopNav = () => (
    <nav className="fixed top-0 w-full z-50 hidden md:flex h-16 border-b"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'var(--border)'
      }}>
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-9 h-9 rounded-xl object-cover" />
            : <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-600">
                <FiBookOpen className="text-white text-lg" />
              </div>}
          <span className="font-bold text-base" style={{ color: 'var(--text)' }}>
            {settings?.site_name || 'منصة الأستاذ'}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="px-3 py-2 text-sm transition hover:opacity-80" style={{ color: 'var(--text-muted)' }}>الرئيسية</Link>
          {userType === 'admin' && <Link href="/dashboard" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600">لوحة التحكم</Link>}
          {userType === 'student' && <Link href="/student" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600">كورساتي</Link>}
          {!userType && <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600">دخول</Link>}
          {userType && <button onClick={handleLogout} className="text-red-500 text-sm mr-2">خروج</button>}
        </div>
      </div>
    </nav>
  );

  // ===== Mobile Bottom Bar =====
  const MobileBottomBar = () => {
    const items = [
      { href: '/', icon: <FiHome size={20} />, label: 'الرئيسية' },
      userType === 'admin' ? { href: '/dashboard', icon: <FiGrid size={20} />, label: 'التحكم' } :
      userType === 'student' ? { href: '/student', icon: <FiBookOpen size={20} />, label: 'كورساتي' } :
      { href: '/login', icon: <FiLogIn size={20} />, label: 'دخول' },
      { href: settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : '#', icon: <FiMessageCircle size={20} />, label: 'تواصل', external: true },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex items-center justify-around py-3">
          {items.map((item, i) => (
            item.external
              ? <a key={i} href={item.href} target="_blank" className="flex flex-col items-center gap-1 transition" style={{ color: 'var(--text-muted)' }}>
                  {item.icon} <span className="text-[10px]">{item.label}</span>
                </a>
              : <Link key={i} href={item.href} className="flex flex-col items-center gap-1 transition" style={{ color: 'var(--text-muted)' }}>
                  {item.icon} <span className="text-[10px]">{item.label}</span>
                </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <DesktopNav />
      <MobileTopHeader />
      <MobileBottomBar />
    </>
  );
}
