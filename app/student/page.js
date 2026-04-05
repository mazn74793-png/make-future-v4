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

  // --- Theme Management ---
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

  // --- Presence System ---
  const updatePresence = useCallback(async (studentId) => {
    await supabase.from('students').update({ last_seen: new Date().toISOString() }).eq('id', studentId);
  }, []);

  // --- Data Loading ---
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: studentData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!studentData || studentData.status !== 'approved') { router.push('/pending'); return; }
      setStudent(studentData);

      // First Login Logic & WhatsApp Notification
      if (!studentData.first_login) {
        await supabase.from('students').update({ first_login: true }).eq('id', studentData.id);
        if (studentData.parent_phone) {
          await supabase.from('whatsapp_notifications').insert({
            student_id: studentData.id,
            type: 'first_login',
            phone: studentData.parent_phone,
            message: `ولي أمر الطالب ${studentData.name}، تم تفعيل حساب نجلكم على منصتنا التعليمية بنجاح ✅`,
          });
        }
      }

      await updatePresence(studentData.id);
      const presenceInterval = setInterval(() => updatePresence(studentData.id), 60000);

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
        supabase.from('exam_attempts').select('exam_id, is_submitted, percentage, score, total_points').eq('student_id', studentData.id),
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

      return () => clearInterval(presenceInterval);
    };
    load();
  }, [router, updatePresence]);

  // --- Handlers ---
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
    </div>
  );

  const enrolledCourses = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');
  const availableCourses = courses.filter(c => !enrollments.includes(c.id) && c.visibility !== 'public');
  const statusLabel = { pending: '⏳ قيد المراجعة', confirmed: '✅ تم التأكيد', delivered: '📦 تم التسليم', cancelled: '❌ ملغي' };

  const tabs = [
    { key: 'home', icon: <FiHome size={17} />, label: 'الرئيسية' },
    { key: 'courses', icon: <FiBookOpen size={17} />, label: `الكورسات (${enrolledCourses.length})` },
    { key: 'exams', icon: <FiFileText size={17} />, label: `الامتحانات (${exams.length})` },
    { key: 'products', icon: <FiPackage size={17} />, label: 'المنتجات' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-10 md:pt-6 animated-bg" dir="rtl"
      style={{ background: 'var(--bg)', color: 'var(--text)', position: 'relative' }}>

      {/* Decorative Background Particles */}
      <div className="p1" /><div className="p2" /><div className="p3" />

      {/* ===== HEADER (Desktop & Mobile Unified) ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b mb-6" 
              style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #f472b6)' }}>
              {student?.name?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm leading-tight">{student?.name}</p>
              <p className="text-xs font-mono opacity-60">{student?.student_code}</p>
            </div>
          </div>

          <nav className="hidden md:flex gap-2">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'shadow-md scale-105' : ''}`}
                style={activeTab === tab.key
                  ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
                  : { color: 'var(--text-muted)' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: isDark ? '#f59e0b' : '#6366f1' }}>
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 bg-red-500/5 text-red-500 transition hover:bg-red-500/10">
              <FiLogOut size={16} /> <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 relative z-10">

        {/* ========== HOME TAB ========== */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Hero */}
              <div className="rounded-3xl p-8 relative overflow-hidden shadow-xl border border-white/5"
                style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1)' }}>
                <div className="relative z-10 text-white">
                  <h1 className="text-3xl font-black mb-2">أهلاً بك، {student?.name?.split(' ')[0]}!</h1>
                  <p className="opacity-80 mb-6">لقد أنجزت خطوات رائعة اليوم. استمر في التقدم!</p>
                  <button onClick={() => setActiveTab('courses')} className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-50 transition">
                    متابعة الدروس
                  </button>
                </div>
                <FiBookOpen className="absolute -bottom-4 -left-4 text-white/10" size={180} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[{ label: 'كورس مفعل', val: enrolledCourses.length, icon: <FiUnlock />, col: '#6366f1' },
                  { label: 'فيديو متاح', val: stats.videos, icon: <FiPlay />, col: '#f472b6' },
                  { label: 'اختبار متاح', val: stats.exams, icon: <FiAward />, col: '#10b981' }
                ].map((s, i) => (
                  <div key={i} className="bg-[var(--surface)] p-5 rounded-3xl border border-[var(--border)] text-center shadow-sm">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white" style={{ background: s.col }}>{s.icon}</div>
                    <p className="text-2xl font-black">{s.val}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Student ID Card */}
              <div className="bg-[var(--surface)] p-6 rounded-3xl border-2 border-dashed border-indigo-500/30 text-center">
                <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-widest">Student Digital ID</p>
                <p className="text-4xl font-black font-mono text-indigo-500 tracking-tighter">{student?.student_code}</p>
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-around text-xs opacity-60">
                  <span>الدفاع: {student?.grade || 'عام'}</span>
                  <span>الحالة: {student?.status}</span>
                </div>
              </div>
              
              {/* Quick Exams View */}
              <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2"><FiAward className="text-indigo-500" /> آخر الامتحانات</h3>
                <div className="space-y-3">
                  {exams.slice(0, 3).map(ex => {
                    const att = getExamAttempt(ex.id);
                    return (
                      <div key={ex.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-sm font-medium truncate max-w-[120px]">{ex.title}</span>
                        {att ? <span className="text-xs font-bold text-green-500">{att.percentage}%</span> : <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-lg">جديد</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== COURSES TAB ========== */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-black mb-4 flex items-center gap-3"><FiUnlock className="text-green-500"/> كورساتي الحالية</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {enrolledCourses.map(course => (
                  <a key={course.id} href={`/student/course/${course.id}`} className="group bg-[var(--surface)] rounded-3xl overflow-hidden border border-[var(--border)] hover:shadow-2xl transition-all hover:-translate-y-2">
                    <div className="aspect-video relative overflow-hidden bg-indigo-100">
                      {course.thumbnail_url ? <img src={course.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> 
                      : <div className="w-full h-full flex items-center justify-center text-indigo-500"><FiBookOpen size={40}/></div>}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-sm mb-2 line-clamp-1">{course.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-bold">تم التفعيل</span>
                        <FiPlay className="text-indigo-500 group-hover:translate-x-[-4px] transition-transform" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {availableCourses.length > 0 && (
              <section>
                <h2 className="text-xl font-black mb-4 flex items-center gap-3"><FiLock className="text-amber-500"/> متاح للتسجيل</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {availableCourses.map(course => {
                    const status = getRequestStatus(course.id);
                    return (
                      <div key={course.id} className="bg-[var(--surface)] rounded-3xl overflow-hidden border border-[var(--border)] opacity-80 hover:opacity-100 transition">
                         <div className="aspect-video bg-[var(--bg)] flex items-center justify-center relative">
                            <FiLock className="text-[var(--text-faint)]" size={30} />
                            {course.thumbnail_url && <img src={course.thumbnail_url} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                         </div>
                         <div className="p-5">
                            <h3 className="font-bold text-sm mb-4 line-clamp-1">{course.title}</h3>
                            {status === 'pending' ? (
                              <button disabled className="w-full py-3 rounded-2xl bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">قيد المراجعة...</button>
                            ) : (
                              <button onClick={() => handleRequest(course.id)} disabled={requesting === course.id} className="w-full py-3 rounded-2xl bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition">
                                {requesting === course.id ? 'جاري الطلب...' : 'إرسال طلب انضمام'}
                              </button>
                            )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ========== EXAMS TAB ========== */}
        {activeTab === 'exams' && (
          <div className="max-w-4xl mx-auto space-y-4">
             <h2 className="text-2xl font-black mb-6">قائمة الامتحانات</h2>
             {exams.map(ex => {
                const att = getExamAttempt(ex.id);
                return (
                  <div key={ex.id} className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] flex items-center justify-between group hover:border-indigo-500/50 transition">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${att ? 'bg-green-500/10 text-green-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                          <FiFileText size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold">{ex.title}</h3>
                          <div className="flex gap-3 mt-1 opacity-60 text-xs font-medium">
                             <span>⏱ {ex.duration_minutes} دقيقة</span>
                             <span>🎯 نجاح من {ex.pass_score}%</span>
                          </div>
                       </div>
                    </div>
                    {att ? (
                      <div className="text-left">
                        <div className={`text-2xl font-black ${att.percentage >= ex.pass_score ? 'text-green-500' : 'text-red-500'}`}>{att.percentage}%</div>
                        <p className="text-[10px] font-bold opacity-60 uppercase">النتيجة النهائية</p>
                      </div>
                    ) : (
                      <a href={`/student/exam/${ex.id}`} className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition">ابدأ الآن</a>
                    )}
                  </div>
                )
             })}
          </div>
        )}

        {/* ========== PRODUCTS TAB ========== */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map(product => {
              const order = getOrder(product.id);
              return (
                <div key={product.id} className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] flex gap-6 items-center">
                  <div className="w-24 h-24 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-4xl">
                    {product.type === 'book' ? '📗' : '📦'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{product.title}</h3>
                    <p className="text-indigo-500 font-black mb-4">{product.price} جنيه</p>
                    
                    {order ? (
                      <div className="inline-block px-4 py-2 rounded-xl text-xs font-bold"
                        style={
                          order.status === 'delivered' ? { background: '#10b98120', color: '#10b981' } :
                          order.status === 'cancelled' ? { background: '#ef444420', color: '#ef4444' } :
                          { background: '#f59e0b20', color: '#f59e0b' }
                        }>
                        {statusLabel[order.status] || 'قيد المعالجة'}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="ملاحظات..." 
                          className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:ring-1 ring-indigo-500 outline-none"
                          onChange={e => setNotes(prev => ({ ...prev, [product.id]: e.target.value }))}
                        />
                        <button 
                          onClick={() => handleOrder(product.id)}
                          disabled={ordering === product.id}
                          className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 disabled:opacity-50"
                        >
                          {ordering === product.id ? '...' : 'طلب'}
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

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 bg-gradient-to-t from-[var(--bg)] to-transparent">
        <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border)] rounded-3xl flex justify-around p-2 shadow-2xl">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all ${activeTab === tab.key ? 'text-indigo-500 scale-110' : 'text-[var(--text-faint)]'}`}>
              {tab.icon}
              <span className="text-[10px] font-bold mt-1">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        :root.dark {
          --bg: #0a0c10;
          --bg2: #11141b;
          --surface: #161b22;
          --text: #f0f6fc;
          --text-muted: #8b949e;
          --text-faint: #484f58;
          --border: rgba(255,255,255,0.08);
          --glass-bg: rgba(13, 17, 23, 0.8);
        }
        :root.light {
          --bg: #f8fafc;
          --bg2: #ffffff;
          --surface: #ffffff;
          --text: #1e293b;
          --text-muted: #64748b;
          --text-faint: #94a3b8;
          --border: rgba(0,0,0,0.06);
          --glass-bg: rgba(255, 255, 255, 0.8);
        }
        .animated-bg { overflow-x: hidden; }
        [class^="p"] { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.1; pointer-events: none; animation: pulse 10s infinite alternate; }
        .p1 { width: 400px; height: 400px; background: #6366f1; top: -100px; right: -100px; }
        .p2 { width: 300px; height: 300px; background: #f472b6; bottom: -50px; left: -50px; animation-delay: 2s; }
        .p3 { width: 250px; height: 250px; background: #10b981; top: 40%; left: 10%; animation-delay: 4s; }
        @keyframes pulse { from { transform: scale(1); opacity: 0.1; } to { transform: scale(1.2); opacity: 0.15; } }
      `}</style>
    </div>
  );
}
