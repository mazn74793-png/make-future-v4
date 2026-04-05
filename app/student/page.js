'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FiBookOpen, FiLogOut, FiPlay, FiShoppingBag, 
  FiUser, FiSun, FiMoon, FiHome, FiCheckCircle 
} from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  // 1. إدارة الثيم (بدون تعقيد)
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

  // 2. جلب البيانات الحقيقية
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // جلب بيانات الطالب
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

        // جلب الكورسات (بدون فلاتر معقدة في البداية عشان نتأكد إنها شغالة)
        const { data: cData } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true);

        setCourses(cData || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]" dir="rtl">
      
      {/* Navbar بسيط */}
      <nav className="h-16 border-b border-[var(--border)] px-6 flex items-center justify-between sticky top-0 bg-[var(--background)] z-50">
        <div className="flex items-center gap-2">
          <FiUser className="text-indigo-500" />
          <span className="font-bold">{student?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="opacity-70">
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="text-red-500">
            <FiLogOut />
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        
        {/* الترحيب */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2">أهلاً بك يا {student?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm opacity-60">المحتوى المتاح لك بناءً على مرحلتك: {student?.stage}</p>
        </div>

        {/* شبكة الكورسات */}
        <section>
          <h2 className="font-bold mb-6 flex items-center gap-2 text-lg">
            <FiBookOpen className="text-indigo-500" /> الكورسات المتاحة
          </h2>
          
          {courses.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-[var(--border)] rounded-2xl text-center opacity-50">
              لا توجد كورسات منشورة حالياً لمرحلتك الدراسية.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--background)] hover:shadow-lg transition-all group">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20"><FiPlay size={40}/></div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-3">{course.title}</h3>
                    <button className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors">
                      دخول الكورس
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* قسم الامتحانات (مثال) */}
        <section className="mt-12">
          <h2 className="font-bold mb-6 flex items-center gap-2 text-lg">
            <FiCheckCircle className="text-emerald-500" /> الامتحانات والتقييمات
          </h2>
          <div className="p-8 border border-[var(--border)] rounded-2xl opacity-60 text-sm">
            سيتم إدراج الامتحانات الخاصة بك هنا فور تفعيلها من قبل المدرس.
          </div>
        </section>

      </main>

      {/* Nav الموبايل - بسيط وعملي */}
      <div className="fixed bottom-0 inset-x-0 h-16 border-t border-[var(--border)] bg-[var(--background)] flex justify-around items-center lg:hidden">
        <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-indigo-500' : 'opacity-40'}><FiHome size={20}/></button>
        <button onClick={() => setActiveTab('courses')} className={activeTab === 'courses' ? 'text-indigo-500' : 'opacity-40'}><FiBookOpen size={20}/></button>
        <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'text-indigo-500' : 'opacity-40'}><FiShoppingBag size={20}/></button>
      </div>

    </div>
  );
}
