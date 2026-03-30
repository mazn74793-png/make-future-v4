'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FiBookOpen, FiVideo, FiUsers, FiEye } from 'react-icons/fi';

export default function DashboardHome() {
  const [stats, setStats] = useState({ courses: 0, videos: 0, students: 0, views: 0 });

  useEffect(() => {
    const load = async () => {
      const { count: courses } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      const { count: videos } = await supabase.from('videos').select('*', { count: 'exact', head: true });
      const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true });
      setStats({ courses: courses || 0, videos: videos || 0, students: students || 0, views: 0 });
    };
    load();
  }, []);

  const cards = [
    { label: 'الكورسات', value: stats.courses, icon: <FiBookOpen />, color: 'from-purple-500 to-blue-500' },
    { label: 'الفيديوهات', value: stats.videos, icon: <FiVideo />, color: 'from-pink-500 to-rose-500' },
    { label: 'الطلاب', value: stats.students, icon: <FiUsers />, color: 'from-green-500 to-emerald-500' },
    { label: 'المشاهدات', value: stats.views, icon: <FiEye />, color: 'from-orange-500 to-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-black mb-8">اهلا يا ادمن</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="glass rounded-2xl p-6 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${c.color} flex items-center justify-center text-white text-xl mb-4`}>{c.icon}</div>
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-gray-400 text-sm">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
