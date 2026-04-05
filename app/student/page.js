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
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // لإدارة التبديل بين الأقسام
  const router = useRouter();

  // 1. إصلاح زرار اللايت مود (تعديل مباشر على الـ DOM)
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved === 'dark');
  }, []);

  const applyTheme = (dark) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#09090b';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#ffffff';
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  // 2. جلب البيانات
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        const { data: stData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
        if (!stData || stData.status !== 'approved') return router.push('/pending');
        setStudent(stData);

        const { data: cData } = await supabase.from('courses').select('*').eq('is_published', true);
        setCourses(cData || []);

        const { data: eData } = await supabase.from('exams').select('*').eq('is_active', true).eq('stage', stData.stage);
        setExams(eData || []);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-[#09090b] bg-white">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>;

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-[#09090b] bg-gray-50 dark:text-white text-gray-900" dir="rtl">
      
      {/* Navbar العلوي */}
      <nav className="h-16 border-b dark:border-white/5 border-gray-200 px-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
            {student?.name?.charAt(0)}
          </div>
          <span className="font-bold text-sm hidden sm:block">{student?.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => applyTheme(!isDark)} 
            className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            {isDark ? <FiSun className="text-yellow-500" /> : <FiMoon className="text-indigo-600" />}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="text-red-500 p-2"><FiLogOut /></button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
        
        {/* التبديل بين المحتوى بناءً على التاب النشط */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-500">
             <div className="mb-8">
                <h1 className="text-2xl font-black">أهلاً، {student?.name?.split(' ')[0]} 👋</h1>
                <p className="text-sm opacity-50">مرحلتك: {student?.stage}</p>
             </div>

             <h2 className="font-bold mb-4 flex items-center gap-2"><FiBookOpen className="text-indigo-500"/> الكورسات</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <div key={course.id} className="dark:bg-white/5 bg-white border dark:border-white/5 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-800">
                      {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-3">{course.title}</h3>
                      <button 
                        onClick={() => router.push(`/student/course/${course.id}`)}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                      >دخول الدرس</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <h2 className="font-bold mb-6 text-xl">الامتحانات المتاحة</h2>
             <div className="space-y-3">
                {exams.map(exam => (
                  <div key={exam.id} onClick={() => router.push(`/student/exam/${exam.id}`)} className="p-4 dark:bg-white/5 bg-white border dark:border-white/5 border-gray-200 rounded-2xl flex justify-between items-center cursor-pointer hover:border-indigo-500">
                    <span className="font-bold">{exam.title}</span>
                    <FiChevronLeft className="text-indigo-500" />
                  </div>
                ))}
                {exams.length === 0 && <p className="text-center opacity-50 py-10">لا توجد امتحانات حالياً</p>}
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="text-center py-10 animate-in fade-in">
              <div className="w-20 h-20 bg-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white">
                {student?.name?.charAt(0)}
              </div>
              <h2 className="text-xl font-bold">{student?.name}</h2>
              <p className="opacity-50 text-sm mt-1">{student?.phone}</p>
              <div className="mt-6 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 max-w-xs mx-auto">
                <p className="text-xs font-bold text-indigo-500 uppercase">حالة الحساب</p>
                <p className="font-bold mt-1">نشط ومفعل</p>
              </div>
           </div>
        )}
      </main>

      {/* بار الموبايل السفلي (شغال فعلياً) */}
      <div className="fixed bottom-0 inset-x-0 h-16 dark:bg-[#09090b]/90 bg-white/90 backdrop-blur-md border-t dark:border-white/5 border-gray-200 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-500 scale-110' : 'opacity-40'}`}
        >
          <FiHome size={20} /><span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('exams')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'exams' ? 'text-indigo-500 scale-110' : 'opacity-40'}`}
        >
          <FiCheckCircle size={20} /><span className="text-[10px] font-bold">الامتحانات</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-indigo-500 scale-110' : 'opacity-40'}`}
        >
          <FiUser size={20} /><span className="text-[10px] font-bold">حسابي</span>
        </button>
      </div>
    </div>
  );
}
