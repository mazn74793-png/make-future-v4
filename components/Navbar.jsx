'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // عشان نعرف الصفحة الحالية
import { supabase } from '@/lib/supabase';
import { FiBookOpen, FiHome, FiMessageCircle, FiLogIn, FiGrid, FiLogOut, FiMoon, FiSun, FiUser } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

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
      className="flex items-center justify-center w-10 h-10 rounded-2xl transition-all active:scale-90 glass"
      style={{ color: isDark ? '#fbbf24' : '#6366f1' }}>
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}

export default function Navbar() {
  const [settings, setSettings] = useState(null);
  const [userType, setUserType] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('site_settings').select('*').single();
      if (data) setSettings(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUserType(null); return; }

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
    if(!confirm('هل تريد تسجيل الخروج؟')) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isActive = (path) => pathname === path;

  // ===== هيدر الموبايل العلوي =====
  const MobileTopHeader = () => (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-16 md:hidden border-b glass">
      <Link href="/" className="flex items-center gap-3">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-primary/20" />
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center gradient-primary text-white font-black shadow-lg shadow-primary/20">
            {settings?.site_name?.[0] || 'A'}
          </div>
        )}
        <div className="flex flex-col">
           <span className="font-black text-sm tracking-tight" style={{ color: 'var(--text)' }}>
             {settings?.site_name || 'المنصة التعليمية'}
           </span>
           <span className="text-[9px] font-bold opacity-60 -mt-0.5 uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
             {settings?.teacher_name || 'Teacher Platform'}
           </span>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {userType && (
           <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-2xl text-rose-500 bg-rose-500/10 border border-rose-500/20 active:scale-90">
             <FiLogOut size={18} />
           </button>
        )}
      </div>
    </div>
  );

  // ===== Desktop Navbar =====
  const DesktopNav = () => (
    <nav className="fixed top-0 w-full z-50 hidden md:flex h-20 border-b glass">
      <div className="max-w-7xl mx-auto px-8 w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-11 h-11 rounded-[14px] object-cover border border-white/10 group-hover:border-primary/50 transition-all" />
          ) : (
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center gradient-primary text-white text-xl font-black shadow-xl shadow-primary/20">
               {settings?.site_name?.[0] || <FiBookOpen />}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight group-hover:text-primary transition-colors" style={{ color: 'var(--text)' }}>
              {settings?.site_name || 'منصة الأستاذ'}
            </span>
            <span className="text-[10px] font-bold text-primary opacity-80 uppercase tracking-[0.2em] -mt-1">Official Platform</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            <Link href="/" className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/') ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>الرئيسية</Link>
            {userType === 'admin' && <Link href="/dashboard" className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/dashboard') ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>لوحة التحكم</Link>}
            {userType === 'student' && <Link href="/student" className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/student') ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-white'}`}>كورساتي</Link>}
          </div>

          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!userType ? (
              <Link href="/login" className="gradient-primary px-7 py-2.5 rounded-2xl text-sm font-black text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <FiLogIn /> دخول
              </Link>
            ) : (
              <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-2xl text-rose-500 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                <FiLogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  // ===== Mobile Bottom Bar =====
  const MobileBottomBar = () => {
    const items = [
      { href: '/', icon: <FiHome />, label: 'الرئيسية' },
      userType === 'admin' ? { href: '/dashboard', icon: <FiGrid />, label: 'التحكم' } :
      userType === 'student' ? { href: '/student', icon: <FiBookOpen />, label: 'دروسي' } :
      { href: '/login', icon: <FiLogIn />, label: 'دخول' },
      { href: settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : '#', icon: <FaWhatsapp size={22} />, label: 'تواصل', external: true },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t glass shadow-[0_-10px_30px_rgba(0,0,0,0.3)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around py-3 px-2">
          {items.map((item, i) => {
            const active = isActive(item.href);
            const content = (
              <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}>
                <div className={`w-12 h-8 rounded-full flex items-center justify-center transition-all ${active ? 'bg-primary/20 text-primary' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-black tracking-tighter ${active ? 'text-primary' : 'text-gray-500'}`}>{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>}
              </div>
            );

            return item.external ? (
              <a key={i} href={item.href} target="_blank" className="relative flex-1">{content}</a>
            ) : (
              <Link key={i} href={item.href} className="relative flex-1">{content}</Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <DesktopNav />
      <MobileTopHeader />
      <MobileBottomBar />
      {/* Spacer لتعويض مساحة الهيدر في الديسكتوب */}
      <div className="hidden md:block h-20"></div>
      {/* Spacer لتعويض مساحة الهيدر في الموبايل */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
