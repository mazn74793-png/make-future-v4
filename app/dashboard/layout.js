'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome, FiBookOpen, FiVideo, FiUsers,
  FiUpload, FiLogOut, FiMenu, FiX, FiSettings,
  FiStar, FiBell, FiBarChart2
} from 'react-icons/fi';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: admin } = await supabase.from('admins').select('*').eq('email', user.email).single();
      if (!admin) { router.push('/'); return; }
      setUser(user);
      setLoading(false);
    };
    check();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const menu = [
    { href: '/dashboard', icon: <FiHome />, label: 'الرئيسية' },
    { href: '/dashboard/courses', icon: <FiBookOpen />, label: 'الكورسات' },
    { href: '/dashboard/videos', icon: <FiVideo />, label: 'الفيديوهات' },
    { href: '/dashboard/videos/upload', icon: <FiUpload />, label: 'رفع فيديو' },
    { href: '/dashboard/students', icon: <FiUsers />, label: 'الطلاب' },
    { href: '/dashboard/testimonials', icon: <FiStar />, label: 'آراء الطلاب' },
    { href: '/dashboard/announcements', icon: <FiBell />, label: 'الإعلانات' },
    { href: '/dashboard/settings', icon: <FiSettings />, label: 'الإعدادات' },
  ];

  return (
    <div className="min-h-screen gradient-dark flex">
      <aside className={`fixed md:static inset-y-0 right-0 z-50 w-72 glass border-l border-white/5 transform transition-transform duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <FiBarChart2 className="text-white" />
              </div>
              <span className="font-bold text-lg">لوحة التحكم</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white"><FiX /></button>
          </div>

          <nav className="space-y-1">
            {menu.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition
                  ${pathname === item.href ? 'gradient-primary text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 pt-4 border-t border-white/5">
            <p className="text-gray-500 text-xs mb-3 px-4">{user?.email}</p>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition w-full">
              <FiLogOut /> تسجيل خروج
            </button>
          </div>

          <div className="mt-4 px-4">
            <Link href="/" className="text-gray-500 hover:text-white text-sm
