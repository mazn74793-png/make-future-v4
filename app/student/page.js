'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FiBookOpen, FiLogOut, FiUnlock, FiPlay, FiFileText, 
  FiShoppingBag, FiUser, FiSun, FiMoon, FiAward, FiHome // تم إضافة FiHome هنا
} from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  // إدارة السيم (Theme)
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

  // جلب بيانات الطالب والكورسات
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { 
          router.push('/login'); 
          return; 
        }

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (studentError || !studentData || studentData.status !== 'approved') { 
          router.push('/pending'); 
          return; 
        }
        
        setStudent(studentData);

        const [{ data: cData }, { data: eData }] = await Promise.all([
          supabase.from('courses').select('*').eq('is_published', true),
          supabase.from('enrollments').select('course_id').eq('student_id', studentData.id).eq('is_active', true)
        ]);

        setCourses(cData || []);
        setEnrollments(eData?.map(e => e.course_id) || []);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="animate-pulse font-bold opacity-50">جاري تحميل بياناتك...</p>
    </div>
  );

  const enrolled = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 pb-24" dir="rtl">
      
      {/* Navbar العلوي */}
      <nav className="fixed top-0 inset-x-0 h-20 glass-card border-b border-[var(--border)] z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <FiUser size={20}/>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">{student?.name}</span>
            <span className="text-[10px] opacity-50">{student?.stage}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-3 glass-card rounded-xl hover:scale-110 transition-all border border-[var(--border)]">
            {isDark ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-500" />}
          </button>
          <button 
            onClick={() => {
              supabase.auth.signOut();
              router.push('/login');
            }} 
            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
          >
            <FiLogOut/>
          </button>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-6 pt-28">
        
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative overflow-hidden mb-8">
              <div className="relative z-10">
                <h1 className="text-3xl md:text-5xl font-black mb-4">
                  أهلاً بك، {student?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="opacity-70 text-lg mb-8 max-w-md">
                  لديك الآن <span className="text-indigo-500 font-bold">{enrolled.length} كورس</span> متاح في مكتبتك الخاصة. جاهز للتعلم؟
                </p>
                <button 
                  onClick={() => setActiveTab('courses')} 
                  className="gradient-primary text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  استكمال التعلم الآن
                </button>
              </div>
              <FiAward className="absolute -bottom-10 -right-10 opacity-[0.03] dark:opacity-[0.05] text-indigo-500" size={300} />
            </div>

            {/* قسم سريع للكورسات الأخيرة */}
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-2 h-6 gradient-primary rounded-full" />
              أحدث الكورسات المتاحة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {enrolled.slice(0, 3).map(course => (
                 <div key={course.id} className="glass-card rounded-3xl p-4 border border-[var(--border)] group hover:border-indigo-500/50 transition-all">
                    <div className="aspect-video rounded-2xl bg-gray-500/10 mb-4 overflow-hidden relative">
                       {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><FiPlay size={40}/></div>}
                    </div>
                    <h3 className="font-bold mb-2 group-hover:text-indigo-500 transition-colors">{course.title}</h3>
                    <button className="w-full py-2 bg-indigo-500/10 text-indigo-500 rounded-xl font-bold text-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">عرض المحتوى</button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="animate-fade-in text-center py-20">
            <FiBookOpen size={50} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-2xl font-bold">مكتبة الكورسات</h2>
            <p className="opacity-50">قريباً سيتم عرض جميع الكورسات هنا</p>
          </div>
        )}

      </main>

      {/* القائمة السفلية للموبايل (Mobile Nav) */}
      <div className="fixed bottom-6 inset-x-6 md:hidden z-50">
        <div className="glass-card h-18 rounded-[2rem] border border-[var(--border)] flex justify-around items-center px-4 shadow-2xl backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-500 scale-110' : 'opacity-40 hover:opacity-100'}`}
          >
            <FiHome size={22}/>
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('courses')} 
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'courses' ? 'text-indigo-500 scale-110' : 'opacity-40 hover:opacity-100'}`}
          >
            <FiBookOpen size={22}/>
            <span className="text-[10px] font-bold">كورساتي</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('products')} 
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'products' ? 'text-indigo-500 scale-110' : 'opacity-40 hover:opacity-100'}`}
          >
            <FiShoppingBag size={22}/>
            <span className="text-[10px] font-bold">المتجر</span>
          </button>
        </div>
      </div>

    </div>
  );
}
