'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FiBookOpen, FiLogOut, FiUnlock, FiPlay, FiFileText, 
  FiShoppingBag, FiUser, FiSun, FiMoon, FiAward 
} from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

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

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: studentData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!studentData || studentData.status !== 'approved') { router.push('/pending'); return; }
      setStudent(studentData);

      const [{ data: cData }, { data: eData }] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true),
        supabase.from('enrollments').select('course_id').eq('student_id', studentData.id).eq('is_active', true)
      ]);

      setCourses(cData || []);
      setEnrollments(eData?.map(e => e.course_id) || []);
      setLoading(false);
    };
    loadData();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const enrolled = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* Header */}
      <nav className="fixed top-0 inset-x-0 h-20 glass z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white"><FiUser size={20}/></div>
          <span className="font-bold hidden md:block">{student?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-3 glass-card rounded-xl">
            {isDark ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-500" />}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><FiLogOut/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {activeTab === 'home' && (
          <div className="glass-card p-10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 relative overflow-hidden">
            <h1 className="text-4xl font-black mb-4">أهلاً بك، {student?.name?.split(' ')[0]}!</h1>
            <p className="opacity-70 mb-8">لديك {enrolled.length} كورس متاح حالياً.</p>
            <button onClick={() => setActiveTab('courses')} className="gradient-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg">استكمال التعلم</button>
            <FiAward className="absolute -bottom-10 -right-10 opacity-5" size={250} />
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <div className="fixed bottom-6 inset-x-6 md:hidden z-50">
        <div className="glass h-16 rounded-2xl flex justify-around items-center px-4">
          <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-indigo-500' : 'opacity-40'}><FiHome size={24}/></button>
          <button onClick={() => setActiveTab('courses')} className={activeTab === 'courses' ? 'text-indigo-500' : 'opacity-40'}><FiBookOpen size={24}/></button>
          <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'text-indigo-500' : 'opacity-40'}><FiShoppingBag size={24}/></button>
        </div>
      </div>
    </div>
  );
}
