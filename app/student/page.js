'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBookOpen, FiLogOut } from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // جيب بيانات الطالب
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!studentData || studentData.status !== 'approved') {
        router.push('/pending');
        return;
      }

      setStudent(studentData);

      // جيب الكورسات المتاحة
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('order');

      setCourses(coursesData || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen gradient-dark" dir="rtl">
      {/* Header */}
      <div className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center font-bold text-white text-lg">
            {student?.name?.[0]}
          </div>
          <div>
            <p className="font-bold">{student?.name}</p>
            <p className="text-gray-400 text-xs">{student?.stage}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm">
          <FiLogOut /> خروج
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black mb-2">اهلاً {student?.name} 👋</h1>
        <p className="text-gray-400 mb-8">دي الكورسات المتاحة ليك</p>

        {courses.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <FiBookOpen className="text-5xl text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">مفيش كورسات متاحة دلوقتي</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="glass rounded-2xl overflow-hidden card-hover animate-fade-in">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 gradient-primary flex items-center justify-center">
                    <FiBookOpen className="text-5xl text-white" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                  {course.description && <p className="text-gray-400 text-sm line-clamp-2">{course.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    {course.stage && <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-lg">{course.stage}</span>}
                    {course.is_free
                      ? <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">مجاني</span>
                      : <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">{course.price} جنيه</span>
                    }
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
