'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUsers, FiBookOpen, FiVideo, FiClock, FiKey, FiTrendingUp, FiDatabase } from 'react-icons/fi';
import Link from 'next/link';

export default function DashboardHome() {
  const [stats, setStats] = useState({ students: 0, courses: 0, videos: 0, pending: 0, accessRequests: 0, exams: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [dbSize, setDbSize] = useState(null);
  const [loading, setLoading] = useState(true);
  'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUsers, FiBookOpen, FiVideo, FiClock, FiKey, FiTrendingUp, FiDatabase } from 'react-icons/fi';
import Link from 'next/link';

export default function DashboardHome() {
  const [stats, setStats] = useState({ students: 0, courses: 0, videos: 0, pending: 0, accessRequests: 0, exams: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [dbSize, setDbSize] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: students },
        { count: courses },
        { count: videos },
        { count: pending },
        { count: accessRequests },
        { count: exams },
        { data: recent },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({ students: students||0, courses: courses||0, videos: videos||0, pending: pending||0, accessRequests: accessRequests||0, exams: exams||0 });
      setRecentStudents(recent || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { label: 'الطلاب المقبولين', value: stats.students, icon: <FiUsers />, color: 'from-purple-500 to-blue-500', href: '/dashboard/students' },
    { label: 'الكورسات المنشورة', value: stats.courses, icon: <FiBookOpen />, color: 'from-pink-500 to-rose-500', href: '/dashboard/courses' },
    { label: 'الفيديوهات', value: stats.videos, icon: <FiVideo />, color: 'from-green-500 to-emerald-500', href: '/dashboard/videos' },
    { label: 'الامتحانات', value: stats.exams, icon: <FiKey />, color: 'from-orange-500 to-yellow-500', href: '/dashboard/exams' },
  ];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">اهلاً يا أدمن 👋</h1>
          <p className="text-gray-400 mt-1">إليك ملخص المنصة</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          المنصة شغالة
        </div>
      </div>

      {/* Alerts */}
      {(stats.pending > 0 || stats.accessRequests > 0) && (
        <div className="glass rounded-2xl p-4 mb-8 border border-yellow-400/20">
          <h3 className="font-bold text-yellow-400 mb-3">⚠️ يحتاج مراجعة</h3>
          <div className="flex flex-wrap gap-3">
            {stats.pending > 0 && (
              <Link href="/dashboard/students" className="bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-400/20 transition">
                ⏳ {stats.pending} طلب تسجيل جديد
              </Link>
            )}
            {stats.accessRequests > 0 && (
              <Link href="/dashboard/students" className="bg-blue-400/10 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-400/20 transition">
                🔑 {stats.accessRequests} طلب وصول لكورس
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <Link key={i} href={c.href}
            className="glass rounded-2xl p-5 card-hover animate-fade-in hover:border-white/20 border border-white/5 transition-all"
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${c.color} flex items-center justify-center text-white text-xl mb-3`}>
              {c.icon}
            </div>
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-gray-400 text-sm mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* آخر الطلاب */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <FiTrendingUp className="text-purple-400" /> آخر الطلاب
            </h2>
            <Link href="/dashboard/students" className="text-purple-400 text-sm hover:text-purple-300">عرض الكل ←</Link>
          </div>
          <div className="space-y-3">
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center font-bold text-white">
                  {s.name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-gray-500 text-xs">{s.email}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(s.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            ))}
            {recentStudents.length === 0 && <p className="text-gray-500 text-center py-4">مفيش طلاب لسه</p>}
          </div>
        </div>

        {/* روابط سريعة */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <FiDatabase className="text-blue-400" /> روابط سريعة
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'رفع فيديو', href: '/dashboard/videos/upload', emoji: '🎬' },
              { label: 'كورس جديد', href: '/dashboard/courses', emoji: '📚' },
              { label: 'امتحان جديد', href: '/dashboard/exams', emoji: '📝' },
              { label: 'إعلان جديد', href: '/dashboard/announcements', emoji: '📢' },
              { label: 'الطلاب', href: '/dashboard/students', emoji: '👥' },
              { label: 'الإعدادات', href: '/dashboard/settings', emoji: '⚙️' },
            ].map((link, i) => (
              <Link key={i} href={link.href}
                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 text-center transition-all hover:scale-105">
                <div className="text-2xl mb-1">{link.emoji}</div>
                <p className="text-sm font-semibold text-gray-300">{link.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  useEffect(() => {
    const load = async () => {
      const [
        { count: students },
        { count: courses },
        { count: videos },
        { count: pending },
        { count: accessRequests },
        { count: exams },
        { data: recent },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({ students: students||0, courses: courses||0, videos: videos||0, pending: pending||0, accessRequests: accessRequests||0, exams: exams||0 });
      setRecentStudents(recent || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { label: 'الطلاب المقبولين', value: stats.students, icon: <FiUsers />, color: 'from-purple-500 to-blue-500', href: '/dashboard/students' },
    { label: 'الكورسات المنشورة', value: stats.courses, icon: <FiBookOpen />, color: 'from-pink-500 to-rose-500', href: '/dashboard/courses' },
    { label: 'الفيديوهات', value: stats.videos, icon: <FiVideo />, color: 'from-green-500 to-emerald-500', href: '/dashboard/videos' },
    { label: 'الامتحانات', value: stats.exams, icon: <FiKey />, color: 'from-orange-500 to-yellow-500', href: '/dashboard/exams' },
  ];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">اهلاً يا أدمن 👋</h1>
          <p className="text-gray-400 mt-1">إليك ملخص المنصة</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          المنصة شغالة
        </div>
      </div>

      {/* Alerts */}
      {(stats.pending > 0 || stats.accessRequests > 0) && (
        <div className="glass rounded-2xl p-4 mb-8 border border-yellow-400/20">
          <h3 className="font-bold text-yellow-400 mb-3">⚠️ يحتاج مراجعة</h3>
          <div className="flex flex-wrap gap-3">
            {stats.pending > 0 && (
              <Link href="/dashboard/students" className="bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-400/20 transition">
                ⏳ {stats.pending} طلب تسجيل جديد
              </Link>
            )}
            {stats.accessRequests > 0 && (
              <Link href="/dashboard/students" className="bg-blue-400/10 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-400/20 transition">
                🔑 {stats.accessRequests} طلب وصول لكورس
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <Link key={i} href={c.href}
            className="glass rounded-2xl p-5 card-hover animate-fade-in hover:border-white/20 border border-white/5 transition-all"
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${c.color} flex items-center justify-center text-white text-xl mb-3`}>
              {c.icon}
            </div>
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-gray-400 text-sm mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* آخر الطلاب */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <FiTrendingUp className="text-purple-400" /> آخر الطلاب
            </h2>
            <Link href="/dashboard/students" className="text-purple-400 text-sm hover:text-purple-300">عرض الكل ←</Link>
          </div>
          <div className="space-y-3">
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center font-bold text-white">
                  {s.name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-gray-500 text-xs">{s.email}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(s.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            ))}
            {recentStudents.length === 0 && <p className="text-gray-500 text-center py-4">مفيش طلاب لسه</p>}
          </div>
        </div>

        {/* روابط سريعة */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <FiDatabase className="text-blue-400" /> روابط سريعة
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'رفع فيديو', href: '/dashboard/videos/upload', emoji: '🎬' },
              { label: 'كورس جديد', href: '/dashboard/courses', emoji: '📚' },
              { label: 'امتحان جديد', href: '/dashboard/exams', emoji: '📝' },
              { label: 'إعلان جديد', href: '/dashboard/announcements', emoji: '📢' },
              { label: 'الطلاب', href: '/dashboard/students', emoji: '👥' },
              { label: 'الإعدادات', href: '/dashboard/settings', emoji: '⚙️' },
            ].map((link, i) => (
              <Link key={i} href={link.href}
                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 text-center transition-all hover:scale-105">
                <div className="text-2xl mb-1">{link.emoji}</div>
                <p className="text-sm font-semibold text-gray-300">{link.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
