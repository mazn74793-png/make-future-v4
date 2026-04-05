'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FiUsers, FiBookOpen, FiVideo, FiKey, 
  FiTrendingUp, FiDatabase, FiAlertCircle, FiArrowUpRight, FiActivity 
} from 'react-icons/fi';
import Link from 'next/link';

export default function DashboardHome() {
  const [stats, setStats] = useState({ students: 0, courses: 0, videos: 0, pending: 0, accessRequests: 0, exams: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [onlineStudents, setOnlineStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [
        { count: students },
        { count: courses },
        { count: videos },
        { count: pending },
        { count: accessRequests },
        { count: exams },
        { data: recent },
        { data: online },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('id,name,email,student_code,created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(6),
        supabase.rpc('get_online_students'),
      ]);

      setStats({ 
        students: students || 0, 
        courses: courses || 0, 
        videos: videos || 0, 
        pending: pending || 0, 
        accessRequests: accessRequests || 0, 
        exams: exams || 0 
      });
      setRecentStudents(recent || []);
      setOnlineStudents(online || []);
    } catch (err) {
      setError("تعذر تحديث بعض البيانات.. يرجى التحقق من اتصالك بالإنترنت");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // تحديث ذكي للطلاب الأونلاين
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc('get_online_students');
      if (data) setOnlineStudents(data);
    }, 45000); // 45 ثانية متوازنة جداً للـ Free Tier

    return () => clearInterval(interval);
  }, [loadData]);

  const cards = [
    { label: 'إجمالي الطلاب', value: stats.students, icon: <FiUsers />, color: 'from-blue-600 to-indigo-600', href: '/dashboard/students' },
    { label: 'الكورسات المنشورة', value: stats.courses, icon: <FiBookOpen />, color: 'from-purple-600 to-pink-600', href: '/dashboard/courses' },
    { label: 'بنك الفيديوهات', value: stats.videos, icon: <FiVideo />, color: 'from-emerald-600 to-teal-600', href: '/dashboard/videos' },
    { label: 'الامتحانات المتاحة', value: stats.exams, icon: <FiTrendingUp />, color: 'from-orange-600 to-amber-600', href: '/dashboard/exams' },
  ];

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
       <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
          </div>
       </div>
       <p className="text-gray-500 font-black animate-pulse tracking-widest text-sm uppercase">Loading Hub...</p>
    </div>
  );

  return (
    <div dir="rtl" className="max-w-7xl mx-auto pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-purple-500/20">Admin Overview</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight text-white">لوحة التحكم <span className="text-purple-500 underline decoration-white/10">الرئيسية</span></h1>
           <p className="text-gray-500 font-medium mt-2">مرحباً بك مجدداً، إليك ملخص نشاط المنصة لهذا اليوم.</p>
        </div>
        
        <button onClick={() => loadData()} className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl transition-all">
           <FiActivity className="text-purple-500 group-hover:rotate-180 transition-transform duration-500" />
           <span className="text-sm font-bold">تحديث البيانات</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((c, i) => (
          <Link key={i} href={c.href} className="group relative glass p-6 rounded-[2rem] border-white/5 overflow-hidden transition-all hover:scale-[1.02] hover:border-purple-500/30">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${c.color} opacity-[0.03] blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xl mb-4 shadow-xl shadow-purple-500/10`}>
              {c.icon}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-tighter mb-1">{c.label}</p>
                <h2 className="text-4xl font-black text-white leading-none">{c.value}</h2>
              </div>
              <FiArrowUpRight className="text-gray-700 group-hover:text-purple-500 transition-colors" size={24} />
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Alerts & Online Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
         {/* Pending Actions */}
         <div className="lg:col-span-2 flex flex-col gap-4">
            {(stats.pending > 0 || stats.accessRequests > 0) ? (
              <div className="glass border-r-4 border-r-amber-500 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                 <div className="relative z-10 text-center md:text-right">
                    <h3 className="text-xl font-black text-amber-500 mb-2">طلبات معلقة تحتاج قرارك</h3>
                    <p className="text-gray-500 text-sm font-medium">يوجد {stats.pending + stats.accessRequests} طلبات بانتظار المراجعة الآن.</p>
                 </div>
                 <div className="flex gap-3 relative z-10">
                    <Link href="/dashboard/students" className="px-6 py-3 bg-amber-500 text-black font-black rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20">مراجعة الطلاب</Link>
                 </div>
                 <div className="absolute left-[-20px] top-[-20px] opacity-[0.05] rotate-12"><FiAlertCircle size={150} /></div>
              </div>
            ) : (
              <div className="glass rounded-[2rem] p-8 border-dashed border-white/10 flex items-center justify-center text-gray-500 font-bold">
                 ✅ لا توجد طلبات معلقة.. المنصة منتظمة!
              </div>
            )}

            {/* Online Pulse */}
            <div className="glass rounded-[2.5rem] p-8 border-emerald-500/10 relative overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative rounded-full h-3 w-3 bg-emerald-500"></span>
                     </div>
                     <h3 className="font-black text-white uppercase tracking-tighter">النشاط اللحظي ({onlineStudents.length})</h3>
                  </div>
               </div>
               <div className="flex flex-wrap gap-2">
                  {onlineStudents.map(s => (
                    <div key={s.id} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 group hover:border-emerald-500/50 transition-all cursor-default">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full group-hover:animate-pulse" />
                       <span className="text-xs font-bold">{s.name?.split(' ')[0]}</span>
                       <span className="text-[10px] font-mono text-gray-500 group-hover:text-emerald-400">#{s.student_code}</span>
                    </div>
                  ))}
                  {onlineStudents.length === 0 && <p className="text-xs text-gray-600 italic">لا يوجد طلاب نشطين حالياً</p>}
               </div>
            </div>
         </div>

         {/* Shortcuts */}
         <div className="glass rounded-[2.5rem] p-8 border-white/5">
            <h3 className="font-black mb-8 flex items-center gap-2 text-gray-400 uppercase tracking-widest text-xs">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { l: 'فيديو', h: '/dashboard/videos/upload', i: '🎬' },
                { l: 'كورس', h: '/dashboard/courses', i: '📚' },
                { l: 'امتحان', h: '/dashboard/exams', i: '📝' },
                { l: 'إعلان', h: '/dashboard/announcements', i: '📢' },
              ].map((link, idx) => (
                <Link key={idx} href={link.h} className="flex flex-col items-center justify-center aspect-square bg-white/5 border border-white/5 rounded-3xl hover:bg-purple-600 hover:border-purple-400 transition-all group">
                   <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{link.i}</span>
                   <span className="text-[10px] font-black group-hover:text-white uppercase">{link.l}</span>
                </Link>
              ))}
            </div>
         </div>
      </div>

      {/* Recent List */}
      <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-3"><FiTrendingUp className="text-purple-500" /> الطلاب الجدد</h3>
            <Link href="/dashboard/students" className="text-xs font-black text-purple-500 bg-purple-500/10 px-4 py-2 rounded-full hover:bg-purple-500 hover:text-white transition-all">عرض قائمة الطلاب</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center font-black text-white shadow-lg border border-white/10">
                    {s.name?.[0]}
                 </div>
                 <div className="min-w-0">
                    <p className="font-bold text-sm truncate text-white">{s.name}</p>
                    <p className="text-[10px] font-mono text-purple-400">#{s.student_code}</p>
                 </div>
                 <div className="mr-auto text-left">
                    <p className="text-[9px] text-gray-500 font-bold">{new Date(s.created_at).toLocaleDateString('ar-EG')}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
