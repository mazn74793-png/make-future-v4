'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock,
  FiSend, FiPlay, FiFileText, FiPackage, FiCheck,
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

  // --- إدارة الثيم (Theme) متوافق مع CSS الخاص بك ---
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
        supabase.from('exam_attempts').select('exam_id, is_submitted, percentage').eq('student_id', studentData.id),
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

  // --- الأكشنز (Actions) ---
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

  const getRequestStatus = (courseId) => requests.find(r => r.course_id === courseId)?.status || null;
  const getExamAttempt = (examId) => attempts.find(a => a.exam_id === examId);
  const getOrder = (productId) => myOrders.find(o => o.product_id === productId);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
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
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
      
      {/* ===== خلفية Aurora المتفاعلة (من ملف الـ CSS الخاص بك) ===== */}
      <div className="site-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
        <div className="p1 particle" /><div className="p2 particle" /><div className="p3 particle" />
      </div>

      {/* ===== Navbar (Glass Design) ===== */}
      <nav className="fixed top-0 left-0 right-0 glass z-50 px-4">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-lg">
              {student?.name?.[0]}
            </div>
            <span className="font-bold text-sm hidden sm:block">{student?.name}</span>
          </div>

          <div className="hidden md:flex gap-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.key ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-9 h-9 glass-card flex items-center justify-center rounded-xl transition-transform active:scale-90">
              {isDark ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-500" />}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors">
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="nav-spacer" />

      {/* ===== المحتوى الرئيسي ===== */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">

        {/* --- HOME TAB --- */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 animate-fade-in">
              <div className="glass-card p-10 relative overflow-hidden group">
                <div className="relative z-10">
                  <h1 className="text-4xl font-black mb-4 gradient-primary bg-clip-text text-transparent">أهلاً، {student?.name?.split(' ')[0]}!</h1>
                  <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
                    استعد لتجربة تعليمية مميزة. لديك اليوم {enrolledCourses.length} كورسات نشطة و {exams.length} اختبارات متاحة.
                  </p>
                  <button onClick={() => setActiveTab('courses')} className="gradient-primary text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform">
                    متابعة التعلم
                  </button>
                </div>
                <FiAward className="absolute -bottom-8 -left-8 text-indigo-500/10 rotate-12 group-hover:scale-110 transition-transform duration-700" size={240} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[{ l: 'كورس', v: enrolledCourses.length, i: <FiUnlock />, c: 'var(--primary)' },
                  { l: 'فيديو', v: stats.videos, i: <FiPlay />, c: 'var(--accent)' },
                  { l: 'اختبار', v: stats.exams, i: <FiAward />, c: 'var(--accent2)' }
                ].map((s, idx) => (
                  <div key={idx} className="glass-card p-6 text-center border-b-4" style={{ borderColor: s.c }}>
                    <div className="text-2xl font-black mb-1">{s.v}</div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="glass-card p-6 text-center border-2 border-dashed border-indigo-500/20">
                <p className="text-[10px] text-[var(--text-faint)] font-bold mb-2 tracking-[0.2em]">STUDENT CODE</p>
                <div className="text-3xl font-black font-mono text-indigo-500">{student?.student_code}</div>
              </div>
              
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><FiClock className="text-indigo-500"/> آخر التحديثات</h3>
                <div className="space-y-4">
                  {exams.slice(0, 3).map(ex => (
                    <div key={ex.id} className="flex items-center justify-between text-sm p-3 rounded-xl bg-[var(--surface)]">
                      <span className="font-medium line-clamp-1">{ex.title}</span>
                      {getExamAttempt(ex.id) ? <FiCheck className="text-green-500"/> : <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- COURSES TAB --- */}
        {activeTab === 'courses' && (
          <div className="space-y-12 animate-fade-in">
            <section>
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="w-2 h-8 gradient-primary rounded-full" /> كورساتك النشطة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {enrolledCourses.map(course => (
                  <a key={course.id} href={`/student/course/${course.id}`} className="glass-card overflow-hidden group">
                    <div className="aspect-video bg-[var(--bg3)] relative overflow-hidden">
                      <img src={course.thumbnail_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FiPlay size={40} className="text-white" />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-sm mb-3 line-clamp-1">{course.title}</h3>
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                        <span>جاهز للمشاهدة</span>
                        <FiUnlock />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- EXAMS TAB --- */}
        {activeTab === 'exams' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
            {exams.map(ex => {
              const att = getExamAttempt(ex.id);
              return (
                <div key={ex.id} className="glass-card p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${att ? 'bg-green-500/10 text-green-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                      <FiFileText />
                    </div>
                    <div>
                      <h3 className="font-bold">{ex.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{ex.duration_minutes} دقيقة • {ex.pass_score}% للنجاح</p>
                    </div>
                  </div>
                  {att ? (
                    <div className="text-center bg-[var(--surface)] px-4 py-2 rounded-2xl">
                      <div className="text-xl font-black">{att.percentage}%</div>
                      <span className="text-[8px] font-bold uppercase text-[var(--text-faint)]">النتيجة</span>
                    </div>
                  ) : (
                    <a href={`/student/exam/${ex.id}`} className="gradient-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/40 transition-shadow">بدء</a>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {products.map(product => {
              const order = getOrder(product.id);
              return (
                <div key={product.id} className="glass-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-full h-40 bg-[var(--bg3)] rounded-2xl mb-4 flex items-center justify-center text-5xl">
                      {product.type === 'book' ? '📚' : '🎁'}
                    </div>
                    <h3 className="font-bold text-lg">{product.title}</h3>
                    <p className="text-indigo-500 font-black text-xl my-2">{product.price} ج.م</p>
                  </div>
                  
                  <div className="mt-4">
                    {order ? (
                      <div className="w-full py-3 text-center rounded-xl font-bold text-xs bg-[var(--surface)] text-indigo-500">
                        {statusLabel[order.status]}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder="عنوان التوصيل أو ملاحظات..." 
                          className="w-full text-xs"
                          onChange={e => setNotes(prev => ({ ...prev, [product.id]: e.target.value }))}
                        />
                        <button 
                          onClick={() => handleOrder(product.id)}
                          disabled={ordering === product.id}
                          className="w-full gradient-primary text-white py-3 rounded-xl text-xs font-bold shadow-lg"
                        >
                          {ordering === product.id ? 'جاري الطلب...' : 'اطلب الآن'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== Mobile Bottom Nav (Glass) ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 bg-gradient-to-t from-[var(--bg)] to-transparent">
        <div className="glass h-16 rounded-3xl flex justify-around items-center px-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.key ? 'text-indigo-500 scale-110' : 'text-[var(--text-faint)]'}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[9px] font-bold uppercase">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
        }
