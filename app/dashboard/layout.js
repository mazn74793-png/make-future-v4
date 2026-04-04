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
      const { data: admin } = await supabase.from('admins').select('*').eq('email', user.email).single();
      if (!admin) {
        const { data: student } = await supabase.from('students').select('status').eq('user_id', user.id).single();
        router.push(student?.status === 'pending' ? '/pending' : '/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    check();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const menu = [
    { href: '/dashboard', label: '🏠 الرئيسية' },
    { href: '/dashboard/students', label: '👥 الطلاب' },
    { href: '/dashboard/attendance', label: '📋 الحضور والغياب' },
    { href: '/dashboard/courses', label: '📚 الكورسات' },
    { href: '/dashboard/videos', label: '🎬 الفيديوهات' },
    { href: '/dashboard/videos/upload', label: '⬆️ رفع فيديو' },
    { href: '/dashboard/exams', label: '📝 الامتحانات' },
    { href: '/dashboard/products', label: '📦 المنتجات' },
    { href: '/dashboard/whatsapp', label: '💬 واتساب' },
    { href: '/dashboard/announcements', label: '📢 الاعلانات' },
    { href: '/dashboard/testimonials', label: '⭐ آراء الطلاب' },
    { href: '/dashboard/gallery', label: '🖼️ معرض الصور' },
    { href: '/dashboard/settings', label: '⚙️ الاعدادات' },
  ];

  return (
    <div className="min-h-screen gradient-dark flex">
      <aside className={'fixed md:static inset-y-0 right-0 z-50 w-64 glass border-l border-white/5 transform transition-transform duration-300 overflow-y-auto ' + (sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0')}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">CP</span>
              </div>
              <span className="font-bold">لوحة التحكم</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">✕</button>
          </div>
          <nav className="space-y-0.5">
            {menu.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={'flex items-center gap-2 px-3 py-2.5 rounded-xl transition text-sm ' +
                  (pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'gradient-primary text-white font-bold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white')}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-gray-500 text-xs mb-2 px-3 truncate">{user?.email}</p>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition w-full text-sm">
              🚪 تسجيل خروج
            </button>
            <Link href="/" className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-white text-sm transition mt-1">
              ← رجوع للموقع
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden min-w-0">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden mb-4 glass p-3 rounded-xl text-lg">☰</button>
        {children}
      </main>
    </div>
  );
}
