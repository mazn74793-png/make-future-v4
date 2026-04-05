'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FiBookOpen, FiLogOut, FiPlay, FiUser, FiSun, FiMoon, 
  FiHome, FiCheckCircle, FiChevronLeft, FiHash, FiActivity
} from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved === 'dark');
    loadData();
  }, []);

  const applyTheme = (dark) => {
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // جلب بيانات الطالب
      const { data: stData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!stData || stData.status !== 'approved') return router.push('/pending');
      setStudent(stData);

      // جلب الكورسات (تأكد أن اسم العمود thumbnail أو image_url)
      const { data: cData } = await supabase.from('courses').select('*').eq('is_published', true);
      setCourses(cData || []);

      // جلب الامتحانات (تأكد أن اسم العمود stage مطابق لمرحلة الطالب)
      const { data: eData } = await supabase.from('exams').select('*').eq('is_active', true).eq('stage', stData.stage);
      setExams(eData || []);

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center dark:bg-[#0b0b0f] bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold animate-pulse text-indigo-500">جاري تحميل المنصة...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-[#0b0b0f] bg-slate-50 dark:text-white text-slate-900 font-sans" dir="rtl">
      
      {/* --- Navigation Bar --- */}
      <nav className="h-20 border-b dark:border-white/5 border-slate-200 px-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#0b0b0f]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <FiUser size={20} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#0b0b0f] rounded-full"></div>
          </div>
          <div className="hidden md:block">
            <h4 className="font-black text-sm leading-none mb-1">{student?.name}</h4>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">كود الطالب: #{student?.id?.toString().slice(0, 5)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => applyTheme(!isDark)} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:scale-105 transition-all text-indigo-500">
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
            <FiLogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
        
        {/* --- Home Tab --- */}
        {activeTab === 'home' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                <div className="relative z-10">
                  <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold mb-4 inline-block italic">مرحباً بك مجدداً</span>
                  <h1 className="text-3xl md:text-5xl font-black mb-4">أهلاً يا {student?.name?.split(' ')[0]}!</h1>
                  <p className="opacity-90 max-w-md text-sm md:text-base leading-relaxed">جاهز النهاردة تكمل رحلة نجاحك؟ عندك {courses.length} كورس متاح لمرحلتك الدراسية.</p>
                </div>
                <FiBookOpen className="absolute -bottom-10 -left-10 size-64 text-white/10 rotate-12" />
             </div>

             <section>
                <div className="flex items-center justify-between mb-8 px-2">
                  <h2 className="text-xl font-black flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
                    كورساتك التعليمية
                  </h2>
                </div>

                {courses.length === 0 ? (
                  <div className="py-20 text-center dark:bg-white/5 bg-white rounded-[2.5rem] border-2 border-dashed dark:border-white/10 border-slate-200">
                    <p className="opacity-50 font-bold">لا توجد كورسات متاحة لمرحلتك حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map(course => (
                      <div key={course.id} className="group dark:bg-[#15151e] bg-white border dark:border-white/5 border-slate-200 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                        <div className="aspect-video relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                          <img 
                            src={course.thumbnail || course.image_url || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000'} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-4 right-4 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg">
                            {course.visibility === 'public' ? 'مجاني' : 'محتوى مدفوع'}
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-black text-lg mb-4 line-clamp-1">{course.title}</h3>
                          <button 
                            onClick={() => router.push(`/student/course/${course.id}`)}
                            className="w-full py-4 bg-slate-100 dark:bg-white/5 dark:hover:bg-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                          >
                            دخول الكورس <FiChevronLeft />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </section>
          </div>
        )}

        {/* --- Exams Tab --- */}
        {activeTab === 'exams' && (
          <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-8">
             <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-emerald-500/20 text-emerald-500 rounded-3xl"><FiCheckCircle size={32}/></div>
                <div>
                   <h2 className="text-3xl font-black">الامتحانات والتقييمات</h2>
                   <p className="text-sm opacity-50 font-bold tracking-widest">تحدى نفسك وحقق أعلى الدرجات</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exams.map(exam => (
                  <div key={exam.id} onClick={() => router.push(`/student/exam/${exam.id}`)} className="p-6 dark:bg-[#15151e] bg-white border-2 dark:border-white/5 border-transparent hover:border-emerald-500 transition-all rounded-[2rem] flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <FiActivity size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-lg">{exam.title}</h4>
                        <p className="text-xs opacity-50 mt-1">المدة: {exam.duration_minutes} دقيقة | مرحلة: {exam.stage}</p>
                      </div>
                    </div>
                    <FiChevronLeft className="text-emerald-500 group-hover:translate-x-[-5px] transition-transform" size={24} />
                  </div>
                ))}
                {exams.length === 0 && (
                  <div className="col-span-full py-32 text-center opacity-30">
                    <FiCheckCircle size={64} className="mx-auto mb-4" />
                    <p className="font-bold">لا توجد امتحانات مفعلة لمرحلتك الآن</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* --- Profile Tab --- */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="dark:bg-[#15151e] bg-white rounded-[3rem] p-10 border dark:border-white/5 border-slate-200 text-center shadow-xl">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-indigo-600 to-purple-500 mx-auto mb-6 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-indigo-500/40">
                  {student?.name?.charAt(0)}
                </div>
                <h2 className="text-3xl font-black mb-2">{student?.name}</h2>
                <div className="flex items-center justify-center gap-2 text-indigo-500 font-bold mb-8">
                  <FiHash /> <span>كود الطالب: {student?.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-right">
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] opacity-50 font-black uppercase mb-1">المرحلة الدراسية</p>
                    <p className="font-bold">{student?.stage}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] opacity-50 font-black uppercase mb-1">رقم الهاتف</p>
                    <p className="font-bold font-mono">{student?.phone || 'غير مسجل'}</p>
                  </div>
                </div>

                <button onClick={() => supabase.auth.signOut()} className="mt-10 w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all">
                  تسجيل الخروج من المنصة
                </button>
             </div>
          </div>
        )}
      </main>

      {/* --- Floating Bottom Bar --- */}
      <div className="fixed bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 h-20 dark:bg-[#1c1c24]/90 bg-white/90 backdrop-blur-2xl border dark:border-white/10 border-slate-200 rounded-[2rem] flex justify-around items-center px-8 z-50 shadow-2xl min-w-[320px] md:min-w-[500px]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-500 scale-110' : 'opacity-30 hover:opacity-100'}`}>
          <FiHome size={24} /><span className="text-[10px] font-black">الرئيسية</span>
        </button>
        
        <button onClick={() => setActiveTab('exams')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'exams' ? 'text-indigo-500 scale-110' : 'opacity-30 hover:opacity-100'}`}>
          <FiCheckCircle size={24} /><span className="text-[10px] font-black">الامتحانات</span>
        </button>

        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-indigo-500 scale-110' : 'opacity-30 hover:opacity-100'}`}>
          <FiUser size={24} /><span className="text-[10px] font-black">حسابي</span>
        </button>
      </div>

    </div>
  );
}
