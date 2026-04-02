'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FiMenu, FiX, FiBookOpen, FiLogIn, FiHome, FiMessageCircle } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [userType, setUserType] = useState(null); // null | 'admin' | 'student'

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
          <Link href="/" className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-xl" />
            ) : (
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <FiBookOpen className="text-white text-xl" />
              </div>
            )}
            <span className="text-xl font-bold bg-gradient-to-l from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {settings?.site_name || 'منصة الأستاذ'}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white transition flex items-center gap-1">
              <FiHome /> الرئيسية
            </Link>
            {settings?.whatsapp_number && (
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                className="text-gray-300 hover:text-green-400 transition flex items-center gap-1">
                <FiMessageCircle /> تواصل
              </a>
            )}
            {userType === 'admin' && (
              <Link href="/dashboard" className="gradient-primary px-5 py-2 rounded-xl text-white font-medium hover:opacity-90 transition">
                لوحة التحكم
              </Link>
            )}
            {userType === 'student' && (
              <>
                <Link href="/student" className="gradient-primary px-5 py-2 rounded-xl text-white font-medium hover:opacity-90 transition">
                  كورساتي
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition text-sm">
                  خروج
                </button>
              </>
            )}
            {!userType && (
              <Link href="/login" className="gradient-primary px-5 py-2 rounded-xl text-white font-medium hover:opacity-90 transition flex items-center gap-1">
                <FiLogIn /> دخول
              </Link>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white text-2xl">
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              <Link href="/" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white py-2">🏠 الرئيسية</Link>
              {settings?.whatsapp_number && (
                <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" className="text-gray-300 hover:text-white py-2">💬 تواصل</a>
              )}
              {userType === 'admin' && (
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="gradient-primary text-center px-6 py-2 rounded-xl text-white font-medium">
                  🎛️ لوحة التحكم
                </Link>
              )}
              {userType === 'student' && (
                <>
                  <Link href="/student" onClick={() => setIsOpen(false)} className="gradient-primary text-center px-6 py-2 rounded-xl text-white font-medium">
                    📚 كورساتي
                  </Link>
                  <button onClick={handleLogout} className="text-red-400 text-center py-2">🚪 خروج</button>
                </>
              )}
              {!userType && (
                <Link href="/login" onClick={() => setIsOpen(false)} className="gradient-primary text-center px-6 py-2 rounded-xl text-white font-medium">
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
