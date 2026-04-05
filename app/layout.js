'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock,
  FiPlay, FiFileText, FiPackage, FiCheck,
  FiHome, FiAward, FiSun, FiMoon
} from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [stats, setStats] = useState({ videos: 0, exams: 0 });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [ordering, setOrdering] = useState(null);
  const [notes, setNotes] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();

  // --- إدارة الثيم ---
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // --- جلب البيانات ---
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: studentData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!studentData || studentData.status !== 'approved') { router.push('/pending'); return; }
      setStudent(studentData);

      const [
        { data: coursesData },
        { data: reqData },
        { data: enrollData },
        { data: examsData },
        { data: attemptsData },
        { data: videosData },
        { data: productsData },
        { data: ordersData },
      ] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true).order('order'),
        supabase.from('access_requests').select('*').eq('student_id', studentData.id),
        supabase.from('enrollments').select('course_id').eq('student_id', studentData.id).eq('is_active', true),
        supabase.from('exams').select('*').eq('is_active', true),
        supabase.from('exam_attempts').select('exam_id, percentage').eq('student_id', studentData.id),
        supabase.from('videos').select('id'),
        supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('product_orders').select('*, products(title)').eq('student_id', studentData.id),
      ]);

      setCourses(coursesData || []);
      setRequests(reqData || []);
      setEnrollments(enrollData?.map(e => e.course_id) || []);
      setExams(examsData || []);
      setAttempts(attemptsData || []);
      setProducts(productsData || []);
      setMyOrders(ordersData || []);
      setStats({ videos: videosData?.length || 0, exams: examsData?.length || 0 });
      setLoading(false);
    };
    loadData();
  }, [router]);

  const handleRequest = async (courseId) => {
    setRequesting(courseId);
    await supabase.from('access_requests').insert({ student_id: student.id, course_id: courseId, status: 'pending' });
    setRequests(prev => [...prev, { course_id: courseId, status: 'pending' }]);
    setRequesting(null);
  };

  const handleOrder = async (productId) => {
    setOrdering(productId);
    const { data, error } = await supabase.from('product_orders').insert({
      product_id: productId, student_id: student.id,
      student_name: student.name, student_phone: student.phone,
      notes: notes[productId] || '', status: 'pending'
    }).select().single();
    if (!error) setMyOrders(prev => [...prev, data]);
    setOrdering(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const enrolledCourses = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');
  const availableCourses = courses.filter(c => !enrollments.includes(c.id) && c.visibility !== 'public');
  const statusLabel = { pending: '⏳ معلق', confirmed: '✅ مؤكد', delivered: '📦 تم', cancelled: '❌ ملغي' };

  const tabs = [
    { key: 'home', icon: <FiHome />, label: 'الرئيسية' },
    { key: 'courses', icon: <FiBookOpen />, label: 'كورساتي' },
    { key: 'exams', icon: <FiFileText />, label: 'الامتحانات' },
    { key: 'products', icon: <FiPackage />, label: 'المتجر' },
  ];

  return (
    <div className="pb-24 pt-4 md:pb-10">
      
      {/* ===== Top Navbar (Glass) ===== */}
      <nav className="fixed top-0 left-0 right-0 glass z-50 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
              {student?.name?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold leading-none">{student?.name}</p>
              <p className="text-[9px] text-[var(--text-faint)] mt-1 font-mono tracking-tighter">{student?.student_code}</p>
            </div>
          </div>

          <div className="hidden md:flex gap-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === tab.key ? 'bg-indigo-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-9 h-9 glass-card flex items-center justify-center rounded-xl transition-all active:scale-90">
              {isDark ? <FiSun className="text-amber-400" size={18} /> : <FiMoon className="text-indigo-500" size={18} />}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="text-[var(--text-muted)] hover:text-red-500 p-2 transition-colors">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="h-20" /> {/* Spacer for Fixed Nav */}

      <main className="max-w-7xl mx-auto px-4">

        {/* --- Home Tab --- */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-8 md:p-12 relative overflow-hidden group">
                <div className="relative z-10">
                  <span className="text-[var(--primary)] text-xs font-black uppercase tracking-[0.3em] mb-2 block">مرحباً بك مجدداً</span>
                  <h1 className="text-3xl md:text-5xl font-black mb-4">كابتن {student?.name?.split(' ')[0]} 🚀</h1>
                  <p className="text-[var(--text-muted)] text-sm md:text-base max-w-md mb-8 leading-relaxed">
                    أنت الآن مسجل في <span className="text-[var(--text)] font-bold">{enrolledCourses.length}</span> كورسات، ولديك <span className="text-[var(--text)] font-bold">{stats.exams}</span> اختبارات بانتظارك.
                  </p>
                  <button onClick={() => setActiveTab('courses')} className="gradient-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all">
                    تصفح المحتوى الدراسي
                  </button>
                </div>
                <FiAward className="absolute -bottom-10 -left-10 text-[var(--primary)] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" size={300} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'كورس مفعل', val: enrolledCourses.length, color: 'var(--primary)' },
                  { label: 'فيديو متاح', val: stats.videos, color: 'var(--accent)' },
                  { label: 'اختبار متاح', val: stats.exams, color: 'var(--accent2)' }
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-5 text-center group hover:border-[var(--primary)]">
                    <p className="text-2xl font-black mb-1 group-hover:scale-110 transition-transform" style={{ color: stat.color }}>{stat.val}</p>
                    <p className="text-[9px] font-black text-[var(--text-faint)] uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 border-2 border-dashed border-[var(--primary)]/20 text-center">
                <p className="text-[10px] text-[var(--text-faint)] font-bold mb-1">YOUR ID CODE</p>
                <p className="text-3xl font-black font-mono text-[var(--primary)]">{student?.student_code}</p>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">آخر الامتحانات</h3>
                <div className="space-y-3">
                  {exams.slice(0, 3).map(ex => (
                    <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] text-[11px]">
                      <span className="font-bold truncate max-w-[120px]">{ex.title}</span>
                      {attempts.find(a => a.exam_id === ex.id) ? 
                        <span className="text-green-500 font-black">تم بنجاح</span> : 
                        <span className="text-[var(--primary)] font-black">لم يُحل</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Courses Tab --- */}
        {activeTab === 'courses' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-xl font-black flex items-center gap-3">كورساتك التعليمية <FiUnlock className="text-[var(--accent2)]"/></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {enrolledCourses.map(course => (
                <a key={course.id} href={`/student/course/${course.id}`} className="glass-card group overflow-hidden">
                  <div className="aspect-video relative overflow-hidden bg-[var(--bg3)]">
                    <img src={course.thumbnail_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FiPlay size={40} className="text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-2 line-clamp-1">{course.title}</h3>
                    <div className="flex items-center justify-between text-[10px] font-black text-[var(--primary)]">
                      <span>جاهز للدراسة</span>
                      <FiCheck />
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {availableCourses.length > 0 && (
              <>
                <div className="h-px bg-[var(--border)] my-8" />
                <h2 className="text-xl font-black flex items-center gap-3 opacity-60">متاح للاشتراك <FiLock /></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {availableCourses.map(course => {
                    const status = requests.find(r => r.course_id === course.id)?.status;
                    return (
                      <div key={course.id} className="glass-card p-4 opacity-70 group hover:opacity-100 transition-all">
                        <h3 className="font-bold text-sm mb-4 truncate">{course.title}</h3>
                        {status === 'pending' ? (
                          <div className="w-full py-2 text-center text-xs font-bold bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">قيد المراجعة</div>
                        ) : (
                          <button onClick={() => handleRequest(course.id)} disabled={requesting === course.id} className="w-full py-2 bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white rounded-lg text-xs font-bold transition-all">
                            {requesting === course.id ? 'جاري الطلب...' : 'إرسال طلب تفعيل'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- Exams & Products remain with same logic but using glass-card --- */}
        {activeTab === 'exams' && (
           <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
             {exams.map(ex => (
               <div key={ex.id} className="glass-card p-6 flex items-center justify-between group">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white text-xl"><FiFileText /></div>
                    <div>
                      <h3 className="font-bold text-sm">{ex.title}</h3>
                      <p className="text-[10px] text-[var(--text-faint)] mt-1">{ex.duration_minutes} دقيقة • {ex.pass_score}% كحد أدنى</p>
                    </div>
                 </div>
                 {attempts.find(a => a.exam_id === ex.id) ? (
                   <div className="text-center bg-[var(--surface)] px-4 py-2 rounded-xl border border-[var(--border)]">
                      <span className="text-xs font-black">{attempts.find(a => a.exam_id === ex.id).percentage}%</span>
                   </div>
                 ) : (
                   <a href={`/student/exam/${ex.id}`} className="bg-[var(--primary)] text-white px-5 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-transform">بدء</a>
                 )}
               </div>
             ))}
           </div>
        )}

        {activeTab === 'products' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
             {products.map(p => {
               const order = myOrders.find(o => o.product_id === p.id);
               return (
                 <div key={p.id} className="glass-card p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="w-full aspect-square rounded-2xl bg-[var(--bg3)] mb-4 flex items-center justify-center text-5xl">
                        {p.type === 'book' ? '📗' : '📦'}
                      </div>
                      <h3 className="font-black text-sm mb-1">{p.title}</h3>
                      <p className="text-[var(--primary)] font-black text-lg">{p.price} ج.م</p>
                    </div>
                    <div className="mt-4">
                      {order ? (
                        <div className="w-full py-2 text-center rounded-xl text-[10px] font-black bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                           {statusLabel[order.status] || 'معلق'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                           <input type="text" placeholder="ملاحظات..." className="w-full text-[10px]" onChange={e => setNotes({...notes, [p.id]: e.target.value})} />
                           <button onClick={() => handleOrder(p.id)} disabled={ordering === p.id} className="w-full gradient-primary text-white py-2 rounded-xl text-xs font-bold">
                              {ordering === p.id ? 'جاري الطلب...' : 'طلب سريع'}
                           </button>
                        </div>
                      )}
                    </div>
                 </div>
               )
             })}
           </div>
        )}
      </main>

      {/* ===== Bottom Nav (Mobile) ===== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:hidden z-50">
        <div className="glass h-16 rounded-2xl flex justify-around items-center px-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.key ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-faint)]'}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[8px] font-bold uppercase">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
