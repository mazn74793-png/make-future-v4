'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FiBookOpen, FiLogOut, FiPlay, FiShoppingBag, 
  FiUser, FiSun, FiMoon, FiHome, FiCheckCircle, FiChevronLeft 
} from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]); // ضفنا جلب الامتحانات
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();

  // 1. نظام الثيم المحسن
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setIsDark(saved === 'dark');
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // 2. جلب البيانات (تعديل الفلترة)
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // جلب بيانات الطالب بدقة
        const { data: stData } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!stData || stData.status !== 'approved') { 
          router.push('/pending'); 
          return; 
        }
        setStudent(stData);

        // جلب الكورسات الخاصة بمرحلة الطالب فقط + الكورسات العامة
        const { data: cData } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .or(`stage.eq.${stData.stage},visibility.eq.public`);

        setCourses(cData || []);

        // جلب الامتحانات المتاحة
        const { data: eData } = await supabase
          .from('exams')
          .select('*')
          .eq('is_active', true)
          .eq('stage', stData.stage);
        
        setExams(eData || []);

      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-slate-900 dark:text-white transition-colors duration-300" dir="rtl">
      
      {/* Navbar عصري */}
      <nav className="h-20 border-b border-slate-200 dark:border-white/5 px-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
            {student?.name?.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">طالب منصة التفوق</p>
            <span className="font-bold text-sm">{student?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:scale-110 transition-all">
            {isDark ? <FiSun className="text-yellow-500" /> : <FiMoon className="text-indigo-600" />}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
            <FiLogOut />
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto pb-24">
        
        {/* هيرو سكشن (ترحيب) */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 md:p-12 mb-12 text-white">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black mb-4">أهلاً بك يا {student?.name?.split(' ')[0]}! 🚀</h1>
            <p className="text-indigo-100 max-w-md leading-relaxed opacity-90">
              أنت الآن في مرحلة <span className="font-bold underline">{student?.stage}</span>. 
              لديك {courses.length} كورس متاح و {exams.length} امتحان بانتظارك.
            </p>
          </div>
          <FiBookOpen className="absolute -bottom-10 -left-10 text-white/10 size-64 rotate-12" />
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* قسم الكورسات (2/3 المساحة) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                الكورسات المتاحة
              </h2>
            </div>
            
            {courses.length === 0 ? (
              <div className="p-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2.5rem] text-center opacity-40">
                لا توجد دروس متاحة حالياً لمرحلتك.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="group bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:border-indigo-500/50 transition-all shadow-sm">
                    <div className="aspect-video relative overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-400">
                          <FiPlay size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold">
                        {course.visibility === 'public' ? 'مجاني' : 'مشترك'}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-4 line-clamp-1">{course.title}</h3>
                      <button 
                        onClick={() => router.push(`/student/course/${course.id}`)}
                        className="w-full py-4 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl font-bold group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
                      >
                        ابدأ التعلم الآن <FiChevronLeft />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* قسم الجانب (الامتحانات) */}
          <div className="space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-500 rounded-full" />
              الامتحانات
            </h2>
            <div className="space-y-4">
              {exams.length > 0 ? exams.map(exam => (
                <div key={exam.id} className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex items-center justify-between group hover:bg-emerald-500 transition-all cursor-pointer" onClick={() => router.push(`/student/exam/${exam.id}`)}>
                  <div>
                    <h4 className="font-bold group-hover:text-white transition-colors">{exam.title}</h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-100 transition-colors mt-1">{exam.duration_minutes} دقيقة</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center group-hover:bg-white group-hover:text-emerald-500 transition-all">
                    <FiCheckCircle />
                  </div>
                </div>
              )) : (
                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-center text-sm opacity-50">
                  لا توجد امتحانات نشطة حالياً.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* شريط الموبايل السفلي */}
      <div className="fixed bottom-6 inset-x-6 h-16 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl flex justify-around items-center lg:hidden z-50 shadow-2xl">
        <button onClick={() => router.push('/student')} className="text-indigo-500"><FiHome size={24}/></button>
        <button onClick={() => router.push('/student/courses')} className="opacity-40"><FiBookOpen size={24}/></button>
        <button className="opacity-40"><FiShoppingBag size={24}/></button>
        <button className="opacity-40"><FiUser size={24}/></button>
      </div>
    </div>
  );
}
