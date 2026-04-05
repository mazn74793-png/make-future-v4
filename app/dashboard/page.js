'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUsers, FiBookOpen, FiVideo, FiKey, FiTrendingUp, FiDatabase, FiAlertCircle } from 'react-icons/fi';
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
        supabase.from('students').select('id,name,email,student_code,created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(5),
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
      console.error("Dashboard Load Error:", err);
      setError("تعذر تحميل بعض البيانات، تأكد من الاتصال.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // تحديث الطلاب الأونلاين فقط كل 30 ثانية لتوفير الداتا
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc('get_online_students');
      if (data) setOnlineStudents(data);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 animate-pulse font-bold">جاري تجهيز اللوحة...</p>
    </div>
  );

  const cards = [
    { label: 'الطلاب المقبولين', value: stats.students, icon: '👥', color: 'from-purple-500 to-blue-500', href: '/dashboard/students' },
    { label: 'الكورسات المنشورة', value: stats.courses, icon: '📚', color: 'from-pink-500 to-rose-500', href: '/dashboard/courses' },
    { label: 'الفيديوهات', value: stats.videos, icon: '🎬', color: 'from-green-500 to-emerald-500', href: '/dashboard/videos' },
    { label: 'الامتحانات', value: stats.exams, icon: '📝', color: 'from-orange-500 to-yellow-500', href: '/dashboard/exams' },
  ];

  return (
    <div dir="rtl" className="animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">أهلاً يا أدمن 👋</h1>
          <p className="text-sm mt-1 opacity-60">إليك نظرة سريعة على أداء المنصة اليوم</p>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm bg-green-500/5 border border-green-500/20 px-4 py-2 rounded-full w-fit">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-500 font-bold">المنصة متصلة وجاهزة</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-2">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Critical Alerts Section */}
      {(stats.pending > 0 || stats.accessRequests > 0) && (
        <div className="glass rounded-2xl p-5 mb-8 border-l-4 border-l-yellow-500 shadow-lg">
          <h3 className="font-bold mb-4 text-yellow-500 flex items-center gap-2">
             🔔 تنبيهات تحتاج إجراء فوري
          </h3>
          <div className="flex flex-wrap gap-3">
            {stats.pending > 0 && (
              <Link href="/dashboard/students" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-5 py-2.5 rounded-xl text-sm font-black hover:bg-yellow-500/20 transition-all border border-yellow-500/10">
                ⏳ {stats.pending} طلب تسجيل جديد
              </Link>
            )}
            {stats.accessRequests > 0 && (
              <Link href="/dashboard/students" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-5 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-500/20 transition-all border border-indigo-500/10">
                🔑 {stats.accessRequests} طلب وصول لكورس
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Online Status Section */}
      {onlineStudents.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-8 border border-emerald-500/20 shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-emerald-500">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              المتواجدون الآن ({onlineStudents.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {onlineStudents.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg group hover:border-emerald-500/30 transition-all">
                <span className="text-[10px] md:text-xs font-bold">{s.name?.split(' ')[0]}</span>
                <span className="text-[10px] font-mono text-indigo-400 opacity-70 group-hover:opacity-100">{s.student_code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <Link key={i} href={c.href}
            className="glass rounded-2xl p-6 card-hover border border-white/5 flex flex-col items-center text-center sm:items-start sm:text-right"
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
              {c.icon}
            </div>
            <p className="text-4xl font-black mb-1">{c.value}</p>
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        {/* Recent Students Table */}
        <div className="glass rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <FiTrendingUp className="text-indigo-500" /> آخر الطلاب المنضمين
            </h2>
            <Link href="/dashboard/students" className="text-xs font-bold text-indigo-500 hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-4">
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-lg shadow-md">
                  {s.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  <p className="text-[10px] opacity-50 truncate">{s.email}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-mono text-indigo-400 font-bold">{s.student_code}</p>
                  <p className="text-[9px] opacity-40">{new Date(s.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            ))}
            {recentStudents.length === 0 && (
              <div className="text-center py-10 opacity-40">لا يوجد طلاب مسجلين حالياً</div>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="glass rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <FiDatabase className="text-emerald-500" /> اختصارات سريعة
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'رفع فيديو', href: '/dashboard/videos/upload', emoji: '🎬' },
              { label: 'كورس جديد', href: '/dashboard/courses', emoji: '📚' },
              { label: 'امتحان', href: '/dashboard/exams', emoji: '📝' },
              { label: 'إعلان', href: '/dashboard/announcements', emoji: '📢' },
              { label: 'الحضور', href: '/dashboard/attendance', emoji: '📋' },
              { label: 'المعرض', href: '/dashboard/gallery', emoji: '🖼️' },
            ].map((link, i) => (
              <Link key={i} href={link.href}
                className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all hover:-translate-y-1">
                <div className="text-3xl mb-2">{link.emoji}</div>
                <p className="text-[10px] font-black opacity-80 uppercase leading-tight">{link.label}</p>
              </Link>
            ))}
          </div>
          
          <Link href="/dashboard/settings" className="mt-6 w-full py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-white/10 transition-all">
             ⚙️ إعدادات المنصة المتقدمة
          </Link>
        </div>
      </div>
    </div>
  );
}
