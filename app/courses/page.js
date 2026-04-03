import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiBookOpen, FiClock, FiLock } from 'react-icons/fi';

export const revalidate = 60;

export default async function CoursesPage() {
  const { data: courses } = await supabase
    .from('courses').select('*').eq('is_published', true).order('order');

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-20 px-4 gradient-dark min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-center mb-4 animate-fade-in">📚 كل الكورسات</h1>
          <p className="text-gray-400 text-center mb-4 animate-fade-in">اختار الكورس اللي يناسبك وابدأ</p>

          {/* رسالة تسجيل الدخول */}
          <div className="glass rounded-2xl p-4 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-500/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <FiLock className="text-purple-400 text-xl flex-shrink-0" />
              <p className="text-gray-300 text-sm">لمشاهدة الفيديوهات لازم تسجل دخول أو تعمل حساب جديد</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/register" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white text-sm font-bold transition">
                حساب جديد
              </Link>
              <Link href="/login" className="gradient-primary px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition">
                تسجيل دخول
              </Link>
            </div>
          </div>

          {courses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <Link href="/login" key={course.id}>
                  <div className="gradient-card rounded-2xl overflow-hidden card-hover border border-white/5 animate-fade-in relative" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="relative h-48">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center">
                          <FiBookOpen className="text-5xl text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-3">
                          <FiLock className="text-white text-xl" />
                        </div>
                      </div>
                      {course.is_free && <span className="absolute top-3 left-3 bg-green-500 px-3 py-1 rounded-full text-xs font-bold">مجاني</span>}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-bold">{course.is_free ? 'مجاني' : `${course.price || 0} جنيه`}</span>
                        {course.duration && <span className="text-gray-500 text-sm flex items-center gap-1"><FiClock />{course.duration}</span>}
                      </div>
                      <div className="mt-3 w-full bg-purple-500/20 text-purple-300 py-2 rounded-xl text-sm text-center font-bold">
                        🔐 سجل دخول للمشاهدة
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FiBookOpen className="text-5xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 text-xl">مفيش كورسات لسه</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
