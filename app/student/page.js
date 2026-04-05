'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FiBookOpen, FiLogOut, FiPlay, FiShoppingBag, 
  FiUser, FiSun, FiMoon, FiAward, FiHome, FiZap, FiStar 
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
      try {
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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  const enrolled = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-indigo-500/30" dir="rtl">
      
      {/* خلفية جمالية ثابتة */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="fixed right-0 top-0 bottom-0 w-24 hidden lg:flex flex-col items-center py-8 gap-8 border-l border-[var(--border)] glass-card z-50">
        <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/40">
          <FiZap size={24} />
        </div>
        <nav className="flex flex-col gap-4 mt-10">
          <SidebarBtn icon={<FiHome/>} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <SidebarBtn icon={<FiBookOpen/>} active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} />
          <SidebarBtn icon={<FiShoppingBag/>} active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <button onClick={toggleTheme} className="p-3 rounded-xl hover:bg-indigo-500/10 transition-all">
            {isDark ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-500" />}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><FiLogOut/></button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="lg:mr-24 p-4 md:p-10 transition-all duration-500">
        
        {/* Header الجوال */}
        <header className="flex lg:hidden items-center justify-between mb-8 glass-card p-4 rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white"><FiUser/></div>
             <span className="font-bold text-sm">{student?.name?.split(' ')[0]}</span>
          </div>
          <button onClick={toggleTheme} className="p-2 glass-card rounded-lg border border-[var(--border)]">
            {isDark ? <FiSun size={18}/> : <FiMoon size={18}/>}
          </button>
        </header>

        {activeTab === 'home' && (
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Hero Section - نيو مودرن */}
            <section className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative glass-card rounded-[2.5rem] p-8 md:p-16 border border-white/10 overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="text-center md:text-right">
                    <span className="inline-block px-4 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-black mb-4 tracking-widest uppercase">منصة التعلم الذكية</span>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-l from-[var(--foreground)] to-gray-400">
                      أهلاً بك، {student?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-lg opacity-60 mb-8 max-w-md leading-relaxed">باقي لك <span className="text-indigo-500 font-bold">3 دروس</span> عشان تخلص كورس "الفيزياء الحديثة". كمل شغفك!</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <button onClick={() => setActiveTab('courses')} className="px-8 py-4 gradient-primary text-white rounded-2xl font-bold shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">ابدأ المذاكرة</button>
                      <button className="px-8 py-4 glass-card border border-[var(--border)] rounded-2xl font-bold hover:bg-white/5 transition-all">جدول الحصص</button>
                    </div>
                  </div>
                  <div className="hidden md:block relative">
                     <div className="w-64 h-64 rounded-full gradient-primary animate-pulse blur-3xl opacity-20 absolute top-0"></div>
                     <FiAward className="text-indigo-500 relative z-10 drop-shadow-2xl" size={200} />
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <StatCard label="درجة الاختبار" value="98%" icon={<FiStar className="text-amber-400"/>} />
               <StatCard label="الكورسات" value={enrolled.length} icon={<FiBookOpen className="text-indigo-400"/>} />
               <StatCard label="النقاط" value="1,250" icon={<FiZap className="text-purple-400"/>} />
               <StatCard label="المستوى" value="A1" icon={<FiAward className="text-emerald-400"/>} />
            </section>

            {/* Courses Preview */}
            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                 <h2 className="text-2xl font-black">كورساتك النشطة</h2>
                 <button onClick={() => setActiveTab('courses')} className="text-indigo-500 font-bold text-sm hover:underline">عرض الكل</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {enrolled.map(course => (
                   <div key={course.id} className="group glass-card rounded-[2rem] border border-[var(--border)] overflow-hidden hover:border-indigo-500/40 transition-all duration-500">
                      <div className="aspect-[16/10] bg-gray-500/5 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                            <FiPlay className="text-white scale-50 group-hover:scale-100 transition-transform duration-500" size={40} />
                         </div>
                         {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><FiBookOpen size={50}/></div>}
                      </div>
                      <div className="p-6">
                         <h3 className="font-bold text-lg mb-4 truncate">{course.title}</h3>
                         <div className="w-full bg-gray-500/10 h-1.5 rounded-full overflow-hidden mb-4">
                            <div className="bg-indigo-500 h-full w-[65%] rounded-full"></div>
                         </div>
                         <div className="flex items-center justify-between text-xs opacity-50">
                            <span>تم إنجاز 65%</span>
                            <span>12 درس باقي</span>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            </section>

          </div>
        )}

      </main>

      {/* Mobile Nav - نيو مودرن */}
      <div className="fixed bottom-0 inset-x-0 p-4 lg:hidden z-[100]">
        <div className="glass-card h-18 rounded-3xl border border-white/10 flex justify-around items-center px-4 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <MobileTab active={activeTab === 'home'} icon={<FiHome size={22}/>} onClick={() => setActiveTab('home')} />
          <MobileTab active={activeTab === 'courses'} icon={<FiBookOpen size={22}/>} onClick={() => setActiveTab('courses')} />
          <MobileTab active={activeTab === 'products'} icon={<FiShoppingBag size={22}/>} onClick={() => setActiveTab('products')} />
          <button onClick={() => supabase.auth.signOut()} className="p-3 text-red-500/50"><FiLogOut size={22}/></button>
        </div>
      </div>
    </div>
  );
}

// مكونات صغيرة (Components) لتقليل تكرار الكود وزيادة النظافة
function SidebarBtn({ icon, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'gradient-primary text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 hover:bg-indigo-500/10 hover:text-indigo-500'}`}
    >
      {icon}
    </button>
  );
}

function MobileTab({ active, icon, onClick }) {
  return (
    <button onClick={onClick} className={`relative p-3 transition-all ${active ? 'text-indigo-500' : 'opacity-40'}`}>
      {icon}
      {active && <span className="absolute -top-1 right-1/2 translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></span>}
    </button>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="glass-card p-5 rounded-3xl border border-[var(--border)] hover:border-indigo-500/20 transition-all group">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-500/5 flex items-center justify-center group-hover:scale-110 transition-transform italic">
             {icon}
          </div>
          <div>
             <p className="text-[10px] opacity-50 font-bold uppercase tracking-tighter">{label}</p>
             <p className="text-lg font-black">{value}</p>
          </div>
       </div>
    </div>
  );
}
