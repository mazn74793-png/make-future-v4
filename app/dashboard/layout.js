'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

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

      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (!admin) {
        // مش أدمن — شوف هل طالب pending أو لا
        const { data: student } = await supabase
          .from('students')
          .select('status')
          .eq('user_id', user.id)
          .single();

        if (student?.status === 'pending') {
          router.push('/pending');
        } else {
          router.push('/login');
        }
        return;
      }

      setUser(user);
      setLoading(false);
    };
    check();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menu = [
    { href: '/dashboard', label: 'الرئيسية' },
    { href: '/dashboard/courses', label: 'الكورسات' },
    { href: '/dashboard/videos', label: 'الفيديوهات' },
    { href: '/dashboard/videos/upload', label: 'رفع فيديو' },
    { href: '/dashboard/students', label: 'الطلاب' },
    { href: '/dashboard/testimonials', label: 'اراء الطلاب' },
    { href: '/dashboard/announcements', label: 'الاعلانات' },
    { href: '/dashboard/settings', label: 'الاعدادات' },
  ];

  return (
    <div className="min-h-screen gradient-dark flex">
      <aside className={'fixed md:static inset-y-0 right-0 z-50 w-72 glass border-l border-white/5 transform transition-transform duration-300 overflow-y-auto ' + (sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0')}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">CP</span>
              </div>
              <span className="font-bold text-lg">لوحة التحكم</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white text-xl">X</button>
          </div>
          <nav className="space-y-1">
            {menu.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={'flex items-center gap-3 px-4 py-3 rounded-xl transition ' + (pathname === item.href ? 'gradient-primary text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white')}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 pt-4 border-t border-white/5">
            <p className="text-gray-500 text-xs mb-3 px-4">{user?.email}</p>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition w-full">
              تسجيل خروج
            </button>
          </div>
          <div className="mt-4 px-4">
            <Link href="/" className="text-gray-500 hover:text-white text-sm transition block">
              رجوع للموقع
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden mb-4 glass p-3 rounded-xl text-xl">
          =
        </button>
        {children}
      </main>
    </div>
  );
}
