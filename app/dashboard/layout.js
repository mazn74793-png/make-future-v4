'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FiHome, FiUsers, FiCalendar, FiBookOpen, 
  FiVideo, FiUploadCloud, FiEdit3, FiPackage, 
  FiMessageCircle, Fi megaphone, FiStar, FiImage, 
  FiSettings, FiLogOut, FiArrowLeft, FiMenu, FiX 
} from 'react-icons/fi';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdmin = async () => {
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
    checkAdmin();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b]">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-bold animate-pulse">جاري التحقق من الصلاحيات...</p>
    </div>
  );

  const menu = [
    { href: '/dashboard', label: 'الرئيسية', icon: FiHome, exact: true },
    { href: '/dashboard/students', label: 'الطلاب', icon: FiUsers },
    { href: '/dashboard/attendance', label: 'الحضور والغياب', icon: FiCalendar },
    { href: '/dashboard/courses', label: 'الكورسات', icon: FiBookOpen },
    { href: '/dashboard/videos', label: 'المحتوى المرئي', icon: FiVideo },
    { href: '/dashboard/exams', label: 'بنك الامتحانات', icon: FiEdit3 },
    { href: '/dashboard/products', label: 'المتجر التعليمي', icon: FiPackage },
    { href: '/dashboard/whatsapp', label: 'مركز الرسائل', icon: FiMessageCircle },
    { href: '/dashboard/settings', label: 'إعدادات المنصة', icon: FiSettings },
  ];

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex overflow-hidden" dir="rtl">
      
      {/* Sidebar Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-[#0c0c0e] border-l border-white/5 
        transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-purple-500/10' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-lg">CP</span>
              </div>
              <div className="leading-tight">
                <h1 className="font-black text-lg tracking-tight">لوحة التحكم</h1>
                <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Admin Panel</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition">
              <FiX size={20} />
            </button>
          </div>

          {/* Navigation Scroll Area */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
            {menu.map((item) => {
              const active = isActive(item);
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200
                    ${active 
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/10 text-purple-400 border border-purple-500/20 shadow-inner' 
                      : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-200'}
                  `}>
                  <item.icon size={18} className={`${active ? 'text-purple-400' : 'group-hover:text-purple-400'} transition-colors`} />
                  <span className={`text-sm font-bold ${active ? 'text-white' : ''}`}>{item.label}</span>
                  {active && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Profile Section */}
          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="bg-white/[0.02] rounded-2xl p-4 mb-4 border border-white/5">
              <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-tighter">المسؤول الحالي</p>
              <p className="text-xs font-bold truncate text-purple-300">{user?.email}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
              >
                <FiLogOut size={14} /> خروج
              </button>
              <Link 
                href="/" 
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold underline"
              >
                <FiArrowLeft size={14} /> الموقع
              </Link>
            </div>
          </div>

        </div>
      </aside>

      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[#0c0c0e] border-b border-white/5">
           <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl">
             <FiMenu size={24} />
           </button>
           <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">CP</span>
           </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto h-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
